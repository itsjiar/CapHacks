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
  // SEARCH
  // ==========================================
  async function searchTutorials(keyword) {
    if (!window.supabase) return;
 
    const query = keyword.trim().toLowerCase();
 
    if (!query) {
      loadTutorials();
      return;
    }
 
    const { data: videos, error } = await window.supabase
      .from('tutorials')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,tags.ilike.%${query}%`)
      .order('created_at', { ascending: true });
 
    if (error) return console.error('Search error:', error);
 
    if (!videos || videos.length === 0) {
      const grid = document.getElementById('videoGrid');
      grid.innerHTML = `
        <div class="search-empty-state">
          <i class="fas fa-search"></i>
          <p>No results for "${keyword}"</p>
        </div>
      `;
      return;
    }
 
    renderVideos(videos);
  }
 
  // Search bar event listeners
  const searchInput = document.getElementById('search-input');
  const searchButton = document.querySelector('.search-button');
  let searchTimeout;
 
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTutorials(e.target.value);
    }, 400);
  });
 
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchTimeout);
      searchTutorials(e.target.value);
    }
  });
 
  searchButton?.addEventListener('click', () => {
    clearTimeout(searchTimeout);
    searchTutorials(searchInput?.value || '');
  });
 
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
            <span class="video-category">${video.category || 'Basic'}</span>
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
            <div class="action-btn-group">
              <button class="rate-button" data-id="${video.id}">
                <i class="fas fa-star"></i>
              </button>
              <span class="action-count rate-count" data-id="${video.id}">0</span>
            </div>
            <div class="action-btn-group">
              <button class="comment-button" data-id="${video.id}">
                <i class="fas fa-comment"></i>
              </button>
              <span class="action-count comment-count" data-id="${video.id}">0</span>
            </div>
            <div class="action-btn-group">
              <button class="save-button" data-id="${video.id}">
                <i class="fas fa-bookmark"></i>
              </button>
            </div>
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
            videoEl.muted = false;
            videoEl.play();
          } else {
            videoEl.muted = true;
            videoEl.pause();
          }
        });
      }, { threshold: 0.6 });
 
      observer.observe(container);
    });
 
    setupAllButtons();
    initNav();
    checkAllInteractions(videos);
    loadCounts(videos);
  }
 
  // ==========================================
  // RENDER SAVED FEED
  // ==========================================
  function renderSavedFeed(videos, startId) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
 
    const backBtn = document.createElement('button');
    backBtn.id = 'savedFeedBackBtn';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to All Videos';
    backBtn.style.cssText = `
      position: fixed; top: 80px; left: 20px; z-index: 100;
      background: rgba(0,0,0,0.7); color: white;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 10px 16px; border-radius: 8px;
      font-family: 'Inter', sans-serif; font-size: 13px;
      cursor: pointer; display: flex; align-items: center;
      gap: 8px; backdrop-filter: blur(10px);
    `;
    backBtn.addEventListener('click', () => {
      backBtn.remove();
      loadTutorials();
    });
    document.body.appendChild(backBtn);
 
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
            <div class="action-btn-group">
              <button class="rate-button" data-id="${video.id}">
                <i class="fas fa-star"></i>
              </button>
              <span class="action-count rate-count" data-id="${video.id}">0</span>
            </div>
            <div class="action-btn-group">
              <button class="comment-button" data-id="${video.id}">
                <i class="fas fa-comment"></i>
              </button>
              <span class="action-count comment-count" data-id="${video.id}">0</span>
            </div>
            <div class="action-btn-group">
              <button class="save-button" data-id="${video.id}">
                <i class="fas fa-bookmark"></i>
              </button>
            </div>
          </div>
        </div>
      `;
 
      grid.appendChild(container);
 
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const videoEl = entry.target.querySelector('.video-player');
          if (!videoEl) return;
          if (entry.isIntersecting) {
            videoEl.muted = false;
            videoEl.play();
          } else {
            videoEl.muted = true;
            videoEl.pause();
          }
        });
      }, { threshold: 0.6 });
 
      observer.observe(container);
    });
 
    setupAllButtons();
    checkAllInteractions(videos);
    initNav();
    loadCounts(videos);
 
    setTimeout(() => {
      const target = document.querySelector(`[data-id="${startId}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
 
  // Make renderSavedFeed globally accessible for auth.js
  window.renderSavedFeed = renderSavedFeed;
 
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
          if (!error) {
            showToast('You rated this tutorial!');
            const countEl = document.querySelector(`.rate-count[data-id="${tutorialId}"]`);
            if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
          }
        } else {
          await window.supabase.from('ratings').delete()
            .match({ tutorial_id: tutorialId, session_id: window.guestSessionId });
          showToast('Rating removed.');
          const countEl = document.querySelector(`.rate-count[data-id="${tutorialId}"]`);
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
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
 
    document.querySelectorAll('.comment-button').forEach((btn) => {
      btn.addEventListener('click', function () {
        const tutorialId = this.dataset.id;
        openCommentPanel(tutorialId);
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
 
  // ==========================================
  // COUNTS — Ratings + Comments
  // ==========================================
  async function loadCounts(videos) {
    for (const video of videos) {
      const { count: rateCount } = await window.supabase
        .from('ratings')
        .select('id', { count: 'exact' })
        .eq('tutorial_id', video.id);
 
      const rateEl = document.querySelector(`.rate-count[data-id="${video.id}"]`);
      if (rateEl) rateEl.textContent = rateCount || 0;
 
      const { count: commentCount } = await window.supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('tutorial_id', video.id);
 
      const commentEl = document.querySelector(`.comment-count[data-id="${video.id}"]`);
      if (commentEl) commentEl.textContent = commentCount || 0;
    }
  }
 
  // ==========================================
  // COMMENT PANEL
  // ==========================================
  let activeTutorialId = null;
 
  async function openCommentPanel(tutorialId) {
    activeTutorialId = tutorialId;
    const panel = document.getElementById('commentPanel');
    const overlay = document.getElementById('commentPanelOverlay');
    panel.classList.add('active');
    overlay.classList.add('active');
 
    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;
    const isGuest = !user || user.email === null;
 
    const guestMsg = document.getElementById('commentGuestMsg');
    const commentInput = document.getElementById('commentInput');
    const sendBtn = document.getElementById('commentSendBtn');
 
    if (isGuest) {
      commentInput.style.display = 'none';
      sendBtn.style.display = 'none';
      guestMsg.style.display = 'block';
    } else {
      commentInput.style.display = 'block';
      sendBtn.style.display = 'flex';
      guestMsg.style.display = 'none';
    }
 
    loadComments(tutorialId);
  }
 
  function closeCommentPanel() {
    document.getElementById('commentPanel').classList.remove('active');
    document.getElementById('commentPanelOverlay').classList.remove('active');
    activeTutorialId = null;
  }
 
  async function loadComments(tutorialId) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '<p class="comments-loading">Loading...</p>';
 
    const { data: comments, error } = await window.supabase
      .from('comments')
      .select(`id, comment_text, created_at, user_id, profiles (full_name, avatar_url)`)
      .eq('tutorial_id', tutorialId)
      .order('created_at', { ascending: false });
 
    if (error || !comments || comments.length === 0) {
      list.innerHTML = '<p class="comments-empty">No comments yet. Be the first!</p>';
      return;
    }
 
    const { data: sessionData } = await window.supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    const isAdmin = currentUser && typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(currentUser.email);
 
    list.innerHTML = '';
 
    for (const comment of comments) {
      const name = comment.profiles?.full_name || 'User';
      const avatar = comment.profiles?.avatar_url;
      const date = new Date(comment.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      });
 
      const { data: replies } = await window.supabase
        .from('replies')
        .select('reply_text, created_at')
        .eq('comment_id', comment.id)
        .order('created_at', { ascending: true });
 
      const repliesHtml = replies?.map(r => `
        <div class="comment-reply">
          <div class="comment-reply-avatar"><i class="fas fa-shield-alt"></i></div>
          <div class="comment-reply-body">
            <span class="comment-reply-name">CapHacks Team</span>
            <p class="comment-reply-text">${r.reply_text}</p>
          </div>
        </div>
      `).join('') || '';
 
      const isOwner = currentUser && currentUser.id === comment.user_id;

      let actionsHtml = '';
      if (isAdmin) {
        actionsHtml += `
          <button class="comment-action-btn comment-reply-btn" data-comment-id="${comment.id}">
            <i class="fas fa-reply"></i> Reply
          </button>
        `;
      }
      if (isOwner) {
        actionsHtml += `
          <button class="comment-action-btn comment-delete-btn" data-comment-id="${comment.id}" style="color: #ff2d55;">
            <i class="fas fa-trash"></i> Delete
          </button>
        `;
      }

      const replyInputHtml = isAdmin ? `
        <div class="reply-input-area" id="replyArea-${comment.id}" style="display:none;">
          <textarea class="reply-input" placeholder="Write a reply..." rows="2"></textarea>
          <button class="reply-send-btn" data-comment-id="${comment.id}">Send</button>
        </div>
      ` : '';
 
      const commentEl = document.createElement('div');
      commentEl.classList.add('comment-item');
      commentEl.innerHTML = `
        <div class="comment-header">
          <div class="comment-avatar">
            ${avatar ? `<img src="${avatar}" alt="${name}">` : `<i class="fas fa-user"></i>`}
          </div>
          <div class="comment-body">
            <span class="comment-name">${name}</span>
            <span class="comment-date">${date}</span>
            <p class="comment-text">${comment.comment_text}</p>
            <div class="comment-actions">
              ${actionsHtml}
            </div>
            ${replyInputHtml}
          </div>
        </div>
        <div class="comment-replies">${repliesHtml}</div>
      `;
 
      list.appendChild(commentEl);
    }
 
    document.querySelectorAll('.comment-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const area = document.getElementById(`replyArea-${btn.dataset.commentId}`);
        area.style.display = area.style.display === 'none' ? 'block' : 'none';
      });
    });

    document.querySelectorAll('.comment-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to delete your comment?")) return;
        const commentId = btn.dataset.commentId;
        const { error } = await window.supabase.from('comments').delete().eq('id', commentId);

        if (!error) {
           loadComments(tutorialId);
           const countEl = document.querySelector(`.comment-count[data-id="${tutorialId}"]`);
           if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
        } else {
           alert("Failed to delete comment. Make sure RLS is configured correctly.");
        }
      });
    });
 
    document.querySelectorAll('.reply-send-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const commentId = btn.dataset.commentId;
        const area = document.getElementById(`replyArea-${commentId}`);
        const text = area.querySelector('.reply-input').value.trim();
        if (!text) return;
 
        const { data: sd } = await window.supabase.auth.getSession();
        const { error } = await window.supabase.from('replies').insert({
          comment_id: commentId,
          admin_id: sd.session.user.id,
          reply_text: text
        });
 
        if (!error) {
          area.querySelector('.reply-input').value = '';
          area.style.display = 'none';
          loadComments(activeTutorialId);
        }
      });
    });
  }
 
  // Send comment
  const commentSendBtn = document.getElementById('commentSendBtn');
  if (commentSendBtn) {
    commentSendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const input = document.getElementById('commentInput');
      const text = input.value.trim();
      if (!text || !activeTutorialId) return;

      const { data } = await window.supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) return;

      const { error } = await window.supabase.from('comments').insert({
        tutorial_id: activeTutorialId,
        user_id: user.id,
        comment_text: text
      });

      if (!error) {
        input.value = '';
        loadComments(activeTutorialId);
        const countEl = document.querySelector(`.comment-count[data-id="${activeTutorialId}"]`);
        if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
      } else {
        console.error("Error inserting comment:", error);
      }
    });
  }
 
  document.getElementById('commentPanelClose')?.addEventListener('click', closeCommentPanel);
  document.getElementById('commentPanelOverlay')?.addEventListener('click', closeCommentPanel);
 
  document.getElementById('commentLoginLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeCommentPanel();
    document.getElementById('loginOpenBtn')?.click();
  });
 
  // ==========================================
  // ADMIN — Upload Modal Logic
  // ==========================================
  async function checkIfAdmin() {
    if (!window.supabase) return;
 
    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;
    if (!user) return;
 
    if (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(user.email)) {
      showAdminButton();
    }
  }
 
  function showAdminButton() {
    const existing = document.getElementById('adminUploadBtn');
    if (existing) return;
 
    const btn = document.createElement('a');
    btn.id = 'adminUploadBtn';
    btn.href = 'admin-dashboard.html';
    btn.innerHTML = '<i class="fas fa-cog"></i>';
    btn.style.cssText = `
      position: fixed; bottom: 40px; right: 90px;
      width: 52px; height: 52px; border-radius: 50%;
      background: #ff2d55; border: none; color: white;
      font-size: 20px; cursor: pointer; z-index: 100;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      text-decoration: none;
    `;
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
    const tags = document.getElementById('uploadTags').value.trim();
    const errorEl = document.getElementById('uploadError');
 
    if (!title || !file) {
      errorEl.textContent = 'Title at video file ay required.';
      return;
    }
 
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadStatus').textContent = 'Uploading video...';
 
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
 
    const { data: urlData } = window.supabase.storage
      .from('caphacksVideos')
      .getPublicUrl(fileName);
 
    const videoUrl = urlData.publicUrl;
 
    const { error: dbError } = await window.supabase.from('tutorials').insert({
      title,
      description,
      category,
      tags,
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
      loadTutorials();
    }, 1000);
  });
 
  // Check admin on load
  checkIfAdmin();
 
  // Re-check pag nag-login
  window.supabase?.auth?.onAuthStateChange(() => {
    checkIfAdmin();
  });
 
  // Start
  loadTutorials();
 
}); // END DOMContentLoaded