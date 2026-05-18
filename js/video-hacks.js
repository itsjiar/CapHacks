document.addEventListener('DOMContentLoaded', function () {

  // ==========================================
  // 1. SUPABASE — Fetch all tutorials
  // ==========================================
  async function loadTutorials() {
    if (!window.supabase) {
      setTimeout(loadTutorials, 100);
      return;
    }

    const { data: videos, error } = await window.supabase
      .from('tutorials')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return console.error('Error fetching tutorials:', error);

    renderVideos(videos);
  }

  // ==========================================
  // 2. RENDER — Gawa ng video cards
  // ==========================================
  function renderVideos(videos) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';

    videos.forEach((video) => {
      const container = document.createElement('div');
      container.classList.add('video-hacks-container');
      container.dataset.id = video.id;

      container.innerHTML = `
        <div class="video-left-position">
          <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <p class="video-description">${video.description || ''}</p>
          </div>
        </div>
        <div class="video-mid-position">
          <video class="video-player" controls>
            <source src="${video.video_url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div class="video-right-position">
          <div class="action-buttons">
            <button class="rate-button" data-id="${video.id}"><i class="fas fa-star"></i></button>
            <button class="comment-button" data-id="${video.id}"><i class="fas fa-comment"></i></button>
            <button class="save-button" data-id="${video.id}"><i class="fas fa-bookmark"></i></button>
          </div>
        </div>
      `;

      grid.appendChild(container);

      // Auto-mute when video leaves screen
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const videoEl = entry.target.querySelector('.video-player');
    if (!videoEl) return;

    if (entry.isIntersecting) {
      videoEl.muted = false; // unmute pag visible
      videoEl.play();        // auto-play pag visible
    } else {
      videoEl.muted = true;  // mute pag wala na sa screen
      videoEl.pause();       // pause din para hindi mag-buffer
    }
  });
}, { threshold: 0.6 }); // 60% ng video visible bago mag-unmute

observer.observe(container);
    });

    setupAllButtons();
    initNav();
    checkAllInteractions(videos);
  }

  // ==========================================
  // 3. BUTTONS — Rate, Comment, Save
  // ==========================================
  function setupAllButtons() {
    document.querySelectorAll('.rate-button').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const tutorialId = this.dataset.id;
        const icon = this.querySelector('i');
        icon.classList.toggle('rated');

        if (icon.classList.contains('rated')) {
          const { error } = await window.supabase.from('ratings').upsert({
            tutorial_id: tutorialId,
            session_id: window.guestSessionId,
            score: 5,
          });
          if (!error) showToast('You rated this tutorial!');
        } else {
          await window.supabase.from('ratings').delete()
            .match({ tutorial_id: tutorialId, session_id: window.guestSessionId });
          showToast('Rating removed.');
        }
      });
    });

    document.querySelectorAll('.save-button').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const tutorialId = this.dataset.id;
        const icon = this.querySelector('i');
        icon.classList.toggle('saved');

        if (icon.classList.contains('saved')) {
          const { error } = await window.supabase.from('progress').upsert({
            tutorial_id: tutorialId,
            session_id: window.guestSessionId,
            is_completed: true,
          });
          if (!error) showToast('Saved.');
        } else {
          await window.supabase.from('progress').delete()
            .match({ tutorial_id: tutorialId, session_id: window.guestSessionId });
          showToast('Removed.');
        }
      });
    });
  }

  // ==========================================
  // 4. CHECK — Existing ratings/saves
  // ==========================================
  async function checkAllInteractions(videos) {
    for (const video of videos) {
      const { data: rating } = await window.supabase
        .from('ratings')
        .select('id')
        .match({ tutorial_id: video.id, session_id: window.guestSessionId })
        .single();

      if (rating) {
        const btn = document.querySelector(`.rate-button[data-id="${video.id}"] i`);
        if (btn) btn.classList.add('rated');
      }

      const { data: bookmark } = await window.supabase
        .from('progress')
        .select('id')
        .match({ tutorial_id: video.id, session_id: window.guestSessionId })
        .single();

      if (bookmark) {
        const btn = document.querySelector(`.save-button[data-id="${video.id}"] i`);
        if (btn) btn.classList.add('saved');
      }
    }
  }

  // ==========================================
  // 5. NAV — Scroll up/down buttons
  // ==========================================
  function initNav() {
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
      setTimeout(() => { isJumping = false; }, 600);
    }

    if (prevButton) prevButton.addEventListener('click', () => jumpToVideo(activeIndex - 1));
    if (nextButton) nextButton.addEventListener('click', () => jumpToVideo(activeIndex + 1));

    window.addEventListener('wheel', (e) => {
      if (isJumping) return;
      e.preventDefault();
      if (e.deltaY > 0) jumpToVideo(activeIndex + 1);
      else jumpToVideo(activeIndex - 1);
    }, { passive: false });

    updateNavButtons();
  }

  // ==========================================
  // 6. TOAST
  // ==========================================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
      position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
      background: #2b2a2a; color: white; padding: 12px 24px; border-radius: 8px;
      z-index: 1000; border: 1px solid rgba(255,255,255,0.1);
      font-family: 'Inter', sans-serif; font-size: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      animation: fadeInOut 3s forwards;
    `;
    const style = document.createElement('style');
    style.innerText = `@keyframes fadeInOut {
      0% { opacity:0; bottom:20px; } 15% { opacity:1; bottom:40px; }
      85% { opacity:1; bottom:40px; } 100% { opacity:0; bottom:20px; }
    }`;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); style.remove(); }, 3000);
  }

  loadTutorials();

  // ==========================================
// ADMIN — Upload Modal Logic
// ==========================================
async function checkIfAdmin() {
  if (!window.supabase) return;

  const { data } = await window.supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return;

  // Role-based authorization: checks app_metadata for 'admin' role.
  // This requires the Supabase backend to be configured to assign roles to users.
  if (user.app_metadata?.role === 'admin') {
    showAdminButton();
  }
}

function showAdminButton() {
  const existing = document.getElementById('adminUploadBtn');
  if (existing) return;

  const btn = document.createElement('button');
  btn.id = 'adminUploadBtn';
  btn.innerHTML = '<i class="fas fa-plus"></i>';
  btn.style.cssText = `
    position: fixed;
    bottom: 40px;
    right: 90px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #ff2d55;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  `;
  btn.addEventListener('click', openUploadModal);
  document.body.appendChild(btn);
}

function openUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('uploadError').textContent = '';
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadBar').value = 0;
}

document.getElementById('uploadCloseBtn')?.addEventListener('click', closeUploadModal);

document.getElementById('uploadSubmitBtn')?.addEventListener('click', async () => {
  const title = document.getElementById('uploadTitle').value.trim();
  const description = document.getElementById('uploadDescription').value.trim();
  const category = document.getElementById('uploadCategory').value;
  const file = document.getElementById('uploadFile').files[0];
  const errorEl = document.getElementById('uploadError');

  if (!title || !file) {
    errorEl.textContent = 'Title at video file ay required.';
    return;
  }

  // Show progress
  document.getElementById('uploadProgress').style.display = 'block';
  document.getElementById('uploadStatus').textContent = 'Uploading video...';

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: storageError } = await window.supabase.storage
    .from('caphacksVideos')
    .upload(fileName, file);

  if (storageError) {
    errorEl.textContent = 'Upload failed: ' + storageError.message;
    document.getElementById('uploadProgress').style.display = 'none';
    return;
  }

  document.getElementById('uploadBar').value = 80;
  document.getElementById('uploadStatus').textContent = 'Saving to database...';

  // Get public URL
  const { data: urlData } = window.supabase.storage
    .from('caphacksVideos')
    .getPublicUrl(fileName);

  const videoUrl = urlData.publicUrl;

  // Save to tutorials table
  const { error: dbError } = await window.supabase.from('tutorials').insert({
    title,
    description,
    category,
    video_url: videoUrl,
    video_filename: fileName,
  });

  if (dbError) {
    errorEl.textContent = 'DB error: ' + dbError.message;
    document.getElementById('uploadProgress').style.display = 'none';
    return;
  }

  document.getElementById('uploadBar').value = 100;
  document.getElementById('uploadStatus').textContent = 'Done!';

  setTimeout(() => {
    closeUploadModal();
    loadTutorials(); // i-refresh yung video list
  }, 1000);
});

// Check admin on load
checkIfAdmin();

// Re-check pag nag-login
window.supabase?.auth?.onAuthStateChange(() => {
  checkIfAdmin();
}); 
});