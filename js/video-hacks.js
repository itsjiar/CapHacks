document.addEventListener('DOMContentLoaded', function() {
  // ==========================================
  // 1. UI LOGIC (Scrolling & Navigation)
  // ==========================================
  const containers = Array.from(document.querySelectorAll('.video-hacks-container'));
  const prevButton = document.querySelector('.video-prev-button');
  const nextButton = document.querySelector('.video-next-button');
  let activeIndex = 0;
  let isJumping = false;

  function updateNavButtons() {
    if (!prevButton || !nextButton) return;
    prevButton.disabled = activeIndex <= 0;
    nextButton.disabled = activeIndex >= containers.length - 1;
  }

  function jumpToVideo(index) {
    if (index < 0 || index >= containers.length || index === activeIndex) return;
    activeIndex = index;
    isJumping = true;
    containers[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateNavButtons();
    window.setTimeout(() => { isJumping = false; }, 600);
  }

  if (prevButton) prevButton.addEventListener('click', () => jumpToVideo(activeIndex - 1));
  if (nextButton) nextButton.addEventListener('click', () => jumpToVideo(activeIndex + 1));

  window.addEventListener('wheel', (event) => {
    if (isJumping) return;
    event.preventDefault();
    if (event.deltaY > 0) jumpToVideo(activeIndex + 1);
    else if (event.deltaY < 0) jumpToVideo(activeIndex - 1);
  }, { passive: false });

  updateNavButtons();

  // ==========================================
  // 2. SUPABASE & BUTTON LOGIC (SMART VERSION)
  // ==========================================
  async function loadTutorial() {
    if (!window.supabase) {
        setTimeout(loadTutorial, 100); 
        return;
    }

    const { data: video, error } = await window.supabase
        .from('tutorials')
        .select('*')
        .eq('video_filename', '01-smooth-velocity.mp4')
        .single();

    if (error) return console.error("Error fetching data:", error);

    if (video) {
        const titleElement = document.querySelector('.video-title');
        const descElement = document.querySelector('.video-description');
        if (titleElement) titleElement.innerText = video.title;
        if (descElement) descElement.innerText = `Category: ${video.category}`;
        
        // --- ADDED: Check natin kung rated na pagka-refresh ---
        checkUserInteractions(video.id);
        
        setupInteractionButtons(video.id);
    }
  }

  // --- NEW FUNCTION: Taga-check ng database para sa kulay ng buttons ---
  async function checkUserInteractions(tutorialId) {
    // Check Ratings
    const { data: rating } = await window.supabase
        .from('ratings')
        .select('id')
        .match({ tutorial_id: tutorialId, session_id: window.guestSessionId })
        .single();

    if (rating) document.querySelector('.rate-button i').classList.add('rated');

    // Check Bookmarks
    const { data: bookmark } = await window.supabase
        .from('progress')
        .select('id')
        .match({ tutorial_id: tutorialId, session_id: window.guestSessionId })
        .single();

    if (bookmark) document.querySelector('.save-button i').classList.add('saved');
  }

  function setupInteractionButtons(tutorialId) {
    const rateBtn = document.querySelector('.rate-button');
    if (rateBtn) {
        rateBtn.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            icon.classList.toggle('rated'); 
            
            if (icon.classList.contains('rated')) {
                // Pinapalitan natin ng .upsert() para iwas duplicate error
                const { error } = await window.supabase.from('ratings').upsert({ 
                    tutorial_id: tutorialId, 
                    session_id: window.guestSessionId, 
                    score: 5 
                });
                if (!error) showToast("You rated this 5 stars! ⭐");
            } else {
                await window.supabase.from('ratings').delete()
                    .match({ tutorial_id: tutorialId, session_id: window.guestSessionId });
                showToast("Rating removed.");
            }
        });
    }

    const saveBtn = document.querySelector('.save-button');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            icon.classList.toggle('saved');
            
            if (icon.classList.contains('saved')) {
                // .upsert() din dito
                const { error } = await window.supabase.from('progress').upsert({ 
                    tutorial_id: tutorialId, 
                    session_id: window.guestSessionId, 
                    is_completed: true 
                });
                if (!error) showToast("Saved.");
            } else {
                await window.supabase.from('progress').delete()
                    .match({ tutorial_id: tutorialId, session_id: window.guestSessionId });
                showToast("Removed.");
            }
        });
    }
  }

  function showToast(message) {
      const toast = document.createElement("div");
      toast.innerText = message;
      toast.style.cssText = `
          position: fixed; 
          bottom: 40px; 
          left: 50%; 
          transform: translateX(-50%); 
          background: #2b2a2a; 
          color: white; 
          padding: 12px 24px; 
          border-radius: 8px; 
          z-index: 1000; 
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          animation: fadeInOut 3s forwards;
      `;
      
      const styleSheet = document.createElement("style");
      styleSheet.innerText = `
          @keyframes fadeInOut {
              0% { opacity: 0; bottom: 20px; }
              15% { opacity: 1; bottom: 40px; }
              85% { opacity: 1; bottom: 40px; }
              100% { opacity: 0; bottom: 20px; }
          }
      `;
      document.head.appendChild(styleSheet);
      document.body.appendChild(toast);
      setTimeout(() => { toast.remove(); styleSheet.remove(); }, 3000);
  }

  loadTutorial();
});