// ==========================================================================
// CAPHACKS - VIDEO HACKS & FEED ENGINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  let allVideos = [];
  let currentFilter = 'all';
  let activeIndex = 0;
  let isGlobalMuted = true;
  let activeTutorialId = null;

  const videoGrid = document.getElementById('videoGrid');
  const searchInput = document.getElementById('search-input');
  const searchInputMobile = document.getElementById('search-input-mobile');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilterBar = document.getElementById('categoryFilterBar');
  const globalSoundToggle = document.getElementById('globalSoundToggle');
  const prevButton = document.getElementById('prevVideoBtn');
  const nextButton = document.getElementById('nextVideoBtn');

  // ==========================================
  // 1. SUPABASE DATA LOADER
  // ==========================================
  async function loadTutorials() {
    if (!window.supabase || !window.supabase.from) {
      setTimeout(loadTutorials, 80);
      return;
    }

    try {
      const { data: videos, error } = await window.supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching tutorials:', error);
        videoGrid.innerHTML = `
          <div class="search-empty-state">
            <i class="fas fa-triangle-exclamation" style="color: var(--secondary-color);"></i>
            <p>Could not load tutorials. Please refresh the page.</p>
          </div>
        `;
        return;
      }

      allVideos = videos || [];

      // Check URL query parameters (e.g. ?cat=Basic or ?video=123)
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('cat');
      const videoParam = urlParams.get('video');

      if (catParam) {
        setCategoryFilter(catParam);
      } else {
        renderFilteredVideos();
      }

      if (videoParam) {
        setTimeout(() => {
          const target = document.querySelector(`[data-id="${videoParam}"]`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    } catch (e) {
      console.error('Fatal load error:', e);
    }
  }

  // ==========================================
  // 2. CATEGORY FILTERING & SEARCH
  // ==========================================
  function setCategoryFilter(category) {
    currentFilter = category;
    
    // Update active pill
    document.querySelectorAll('.cat-pill').forEach(pill => {
      const pillCat = pill.dataset.category;
      if (pillCat.toLowerCase() === category.toLowerCase()) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    renderFilteredVideos();
  }

  categoryFilterBar?.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    const cat = pill.dataset.category;
    setCategoryFilter(cat);
  });

  function renderFilteredVideos() {
    let filtered = allVideos;
    if (currentFilter && currentFilter !== 'all') {
      filtered = allVideos.filter(v => 
        (v.category || 'Basic').toLowerCase() === currentFilter.toLowerCase()
      );
    }

    const query = (searchInput?.value || searchInputMobile?.value || '').trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(v => 
        (v.title || '').toLowerCase().includes(query) ||
        (v.description || '').toLowerCase().includes(query) ||
        (v.tags || '').toLowerCase().includes(query) ||
        (v.category || '').toLowerCase().includes(query)
      );
    }

    if (filtered.length === 0) {
      videoGrid.innerHTML = `
        <div class="search-empty-state">
          <i class="fas fa-video-slash"></i>
          <p>No video tutorials found matching your criteria.</p>
        </div>
      `;
      return;
    }

    renderVideos(filtered);
  }

  let searchDebounce;
  function handleSearchInput(value) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      renderFilteredVideos();
    }, 250);
  }

  searchInput?.addEventListener('input', (e) => handleSearchInput(e.target.value));
  searchInputMobile?.addEventListener('input', (e) => handleSearchInput(e.target.value));
  searchBtn?.addEventListener('click', () => renderFilteredVideos());

  // ==========================================
  // 3. SOUND MANAGEMENT
  // ==========================================
  function updateSoundUI() {
    const icon = document.getElementById('soundIcon');
    const label = document.getElementById('soundLabel');
    if (!icon || !label) return;

    if (isGlobalMuted) {
      icon.className = 'fas fa-volume-xmark';
      label.textContent = 'Sound Off';
      globalSoundToggle?.classList.remove('active');
    } else {
      icon.className = 'fas fa-volume-high';
      label.textContent = 'Sound On';
      globalSoundToggle?.classList.add('active');
    }

    // Apply to all active video tags
    document.querySelectorAll('.video-player').forEach(v => {
      v.muted = isGlobalMuted;
    });
  }

  globalSoundToggle?.addEventListener('click', () => {
    isGlobalMuted = !isGlobalMuted;
    updateSoundUI();
    showToast(isGlobalMuted ? 'Muted audio' : 'Unmuted audio');
  });

  // ==========================================
  // 4. RENDER VIDEO CARDS
  // ==========================================
  function renderVideos(videos) {
    videoGrid.innerHTML = '';
    activeIndex = 0;

    videos.forEach((video, index) => {
      const container = document.createElement('div');
      container.classList.add('video-hacks-container');
      container.dataset.id = video.id;
      container.dataset.index = index;

      const catLower = (video.category || 'Basic').toLowerCase();
      const tagsHtml = (video.tags || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => `<span class="video-tag">#${t}</span>`)
        .join(' ');

      container.innerHTML = `
        <div class="video-mid-position">
          <video class="video-player" loop playsinline preload="metadata">
            <source src="${video.video_url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <div class="play-pause-indicator"><i class="fas fa-play"></i></div>

          <div class="video-left-position">
            <div class="video-info">
              <div class="video-header-meta">
                <span class="video-category ${catLower}">${video.category || 'Basic'}</span>
              </div>
              <h3 class="video-title">${video.title}</h3>
              ${video.description ? `<p class="video-description">${video.description}</p>` : ''}
              ${tagsHtml ? `<div class="video-tags-row">${tagsHtml}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="video-right-position">
          <div class="action-buttons">
            <div class="action-btn-group">
              <button class="rate-button" data-id="${video.id}" aria-label="Rate tutorial">
                <i class="fas fa-star"></i>
              </button>
              <span class="action-count rate-count" data-id="${video.id}">0</span>
            </div>

            <div class="action-btn-group">
              <button class="comment-button" data-id="${video.id}" aria-label="Comments">
                <i class="fas fa-comment-dots"></i>
              </button>
              <span class="action-count comment-count" data-id="${video.id}">0</span>
            </div>

            <div class="action-btn-group">
              <button class="save-button" data-id="${video.id}" aria-label="Save to library">
                <i class="fas fa-bookmark"></i>
              </button>
            </div>

            <div class="action-btn-group">
              <button class="share-button" data-id="${video.id}" data-title="${video.title}" aria-label="Share tutorial">
                <i class="fas fa-share-nodes"></i>
              </button>
            </div>

            <div class="action-btn-group">
              <button class="sound-button" aria-label="Toggle sound">
                <i class="fas ${isGlobalMuted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      videoGrid.appendChild(container);

      // Play/Pause Click on Video Wrapper
      const midWrapper = container.querySelector('.video-mid-position');
      const videoEl = container.querySelector('.video-player');
      const indicator = container.querySelector('.play-pause-indicator');

      midWrapper.addEventListener('click', (e) => {
        // Prevent click if user clicked info card
        if (e.target.closest('.video-info')) return;

        if (videoEl.paused) {
          videoEl.play();
          indicator.innerHTML = '<i class="fas fa-play"></i>';
        } else {
          videoEl.pause();
          indicator.innerHTML = '<i class="fas fa-pause"></i>';
        }
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 500);
      });
    });

    setupInteractionObserver();
    setupButtonEvents();
    checkExistingInteractions(videos);
    loadInteractionCounts(videos);
    updateNavButtons();
  }

  // ==========================================
  // 5. INTERSECTION OBSERVER (Auto play/pause)
  // ==========================================
  let feedObserver;
  function setupInteractionObserver() {
    if (feedObserver) feedObserver.disconnect();

    feedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoEl = entry.target.querySelector('.video-player');
        if (!videoEl) return;

        if (entry.isIntersecting) {
          activeIndex = parseInt(entry.target.dataset.index, 10) || 0;
          updateNavButtons();
          videoEl.muted = isGlobalMuted;
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              videoEl.muted = true;
              videoEl.play().catch(() => {});
            });
          }
        } else {
          videoEl.pause();
          videoEl.currentTime = 0;
        }
      });
    }, { threshold: 0.65 });

    document.querySelectorAll('.video-hacks-container').forEach(c => feedObserver.observe(c));
  }

  // ==========================================
  // 6. ACTION BUTTON LISTENERS
  // ==========================================
  function setupButtonEvents() {
    // Rate / Like button
    document.querySelectorAll('.rate-button').forEach(btn => {
      btn.onclick = async function () {
        const tutorialId = this.dataset.id;
        const icon = this.querySelector('i');
        const isRated = icon.classList.contains('rated');
        const countEl = document.querySelector(`.rate-count[data-id="${tutorialId}"]`);
        const currentCount = parseInt(countEl?.textContent || '0', 10);

        if (!isRated) {
          icon.classList.add('rated');
          if (countEl) countEl.textContent = currentCount + 1;
          showToast('Rated this tutorial! ⭐');

          await window.supabase.from('ratings').upsert({
            tutorial_id: tutorialId,
            session_id: window.guestSessionId,
            score: 5,
          });
        } else {
          icon.classList.remove('rated');
          if (countEl) countEl.textContent = Math.max(0, currentCount - 1);
          showToast('Rating removed');

          await window.supabase.from('ratings').delete().match({
            tutorial_id: tutorialId,
            session_id: window.guestSessionId
          });
        }
      };
    });

    // Save / Bookmark button
    document.querySelectorAll('.save-button').forEach(btn => {
      btn.onclick = async function () {
        const tutorialId = this.dataset.id;
        const icon = this.querySelector('i');
        const isSaved = icon.classList.contains('saved');

        if (!isSaved) {
          icon.classList.add('saved');
          showToast('Saved to your library! 🔖');

          await window.supabase.from('progress').upsert({
            tutorial_id: tutorialId,
            session_id: window.guestSessionId,
            is_completed: true,
          });
        } else {
          icon.classList.remove('saved');
          showToast('Removed from saved library');

          await window.supabase.from('progress').delete().match({
            tutorial_id: tutorialId,
            session_id: window.guestSessionId
          });
        }
      };
    });

    // Comment button
    document.querySelectorAll('.comment-button').forEach(btn => {
      btn.onclick = function () {
        openCommentPanel(this.dataset.id);
      };
    });

    // Share button
    document.querySelectorAll('.share-button').forEach(btn => {
      btn.onclick = function () {
        const tutorialId = this.dataset.id;
        const shareUrl = `${window.location.origin}${window.location.pathname}?video=${tutorialId}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Link copied to clipboard! 🔗');
          }).catch(() => {
            showToast(`Share URL: ${shareUrl}`);
          });
        } else {
          showToast(`Share URL: ${shareUrl}`);
        }
      };
    });

    // Single video sound toggle
    document.querySelectorAll('.sound-button').forEach(btn => {
      btn.onclick = function () {
        isGlobalMuted = !isGlobalMuted;
        updateSoundUI();
        document.querySelectorAll('.sound-button i').forEach(si => {
          si.className = `fas ${isGlobalMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`;
        });
      };
    });
  }

  // ==========================================
  // 7. CHECK EXISTING INTERACTIONS
  // ==========================================
  async function checkExistingInteractions(videos) {
    if (!window.supabase || !videos) return;
    const sessionId = window.guestSessionId;

    for (const video of videos) {
      try {
        const { data: rating } = await window.supabase
          .from('ratings')
          .select('id')
          .match({ tutorial_id: video.id, session_id: sessionId })
          .maybeSingle();

        if (rating) {
          const btn = document.querySelector(`.rate-button[data-id="${video.id}"] i`);
          if (btn) btn.classList.add('rated');
        }

        const { data: bookmark } = await window.supabase
          .from('progress')
          .select('id')
          .match({ tutorial_id: video.id, session_id: sessionId })
          .maybeSingle();

        if (bookmark) {
          const btn = document.querySelector(`.save-button[data-id="${video.id}"] i`);
          if (btn) btn.classList.add('saved');
        }
      } catch (e) {}
    }
  }

  // ==========================================
  // 8. INTERACTION COUNTS
  // ==========================================
  async function loadInteractionCounts(videos) {
    if (!window.supabase || !videos) return;

    for (const video of videos) {
      try {
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
      } catch (e) {}
    }
  }

  // ==========================================
  // 9. NAVIGATION (Arrows & Keyboard)
  // ==========================================
  function updateNavButtons() {
    const containers = document.querySelectorAll('.video-hacks-container');
    if (!prevButton || !nextButton) return;
    prevButton.disabled = activeIndex <= 0;
    nextButton.disabled = activeIndex >= containers.length - 1;
  }

  function jumpToVideo(index) {
    const containers = document.querySelectorAll('.video-hacks-container');
    if (index < 0 || index >= containers.length) return;
    activeIndex = index;
    containers[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateNavButtons();
  }

  prevButton?.addEventListener('click', () => jumpToVideo(activeIndex - 1));
  nextButton?.addEventListener('click', () => jumpToVideo(activeIndex + 1));

  // Keyboard navigation shortcuts
  window.addEventListener('keydown', (e) => {
    // If typing in input/textarea, ignore shortcuts
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      jumpToVideo(activeIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      jumpToVideo(activeIndex - 1);
    } else if (e.key === 'm' || e.key === 'M') {
      isGlobalMuted = !isGlobalMuted;
      updateSoundUI();
    } else if (e.key === ' ') {
      e.preventDefault();
      const currentVideo = document.querySelectorAll('.video-player')[activeIndex];
      if (currentVideo) {
        if (currentVideo.paused) currentVideo.play();
        else currentVideo.pause();
      }
    }
  });

  // ==========================================
  // 10. COMMENT PANEL LOGIC
  // ==========================================
  async function openCommentPanel(tutorialId) {
    activeTutorialId = tutorialId;
    const panel = document.getElementById('commentPanel');
    const overlay = document.getElementById('commentPanelOverlay');
    panel?.classList.add('active');
    overlay?.classList.add('active');

    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;
    const isGuest = !user || user.email === null;

    const guestMsg = document.getElementById('commentGuestMsg');
    const commentInput = document.getElementById('commentInput');
    const sendBtn = document.getElementById('commentSendBtn');

    if (isGuest) {
      if (commentInput) commentInput.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'none';
      if (guestMsg) guestMsg.style.display = 'block';
    } else {
      if (commentInput) commentInput.style.display = 'block';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (guestMsg) guestMsg.style.display = 'none';
    }

    loadComments(tutorialId);
  }

  function closeCommentPanel() {
    document.getElementById('commentPanel')?.classList.remove('active');
    document.getElementById('commentPanelOverlay')?.classList.remove('active');
    activeTutorialId = null;
  }

  document.getElementById('commentPanelClose')?.addEventListener('click', closeCommentPanel);
  document.getElementById('commentPanelOverlay')?.addEventListener('click', closeCommentPanel);
  document.getElementById('commentLoginLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeCommentPanel();
    document.getElementById('loginOpenBtn')?.click();
  });

  async function loadComments(tutorialId) {
    const list = document.getElementById('commentsList');
    if (!list) return;
    list.innerHTML = '<p class="comments-loading">Loading creator discussion...</p>';

    try {
      const { data: comments, error } = await window.supabase
        .from('comments')
        .select(`id, comment_text, created_at, user_id, profiles (full_name, avatar_url)`)
        .eq('tutorial_id', tutorialId)
        .order('created_at', { ascending: false });

      if (error || !comments || comments.length === 0) {
        list.innerHTML = '<p class="comments-empty">No comments yet. Be the first creator to share your thoughts!</p>';
        return;
      }

      const { data: sessionData } = await window.supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      const isAdmin = currentUser && window.isAdminUser ? window.isAdminUser(currentUser) : false;

      list.innerHTML = '';

      for (const comment of comments) {
        const name = comment.profiles?.full_name || 'Creator';
        const avatar = comment.profiles?.avatar_url;
        const date = new Date(comment.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric'
        });

        const isOwner = currentUser && currentUser.id === comment.user_id;

        const { data: replies } = await window.supabase
          .from('replies')
          .select('reply_text, created_at')
          .eq('comment_id', comment.id)
          .order('created_at', { ascending: true });

        const repliesHtml = replies?.map(r => `
          <div class="comment-reply">
            <div class="comment-reply-avatar"><i class="fas fa-shield-alt"></i></div>
            <div>
              <span class="comment-reply-name">CapHacks Team</span>
              <p class="comment-reply-text">${r.reply_text}</p>
            </div>
          </div>
        `).join('') || '';

        let actionsHtml = '';
        if (isAdmin) {
          actionsHtml += `
            <button class="comment-action-btn comment-reply-btn" data-comment-id="${comment.id}">
              <i class="fas fa-reply"></i> Reply
            </button>
          `;
        }
        if (isOwner || isAdmin) {
          actionsHtml += `
            <button class="comment-action-btn comment-delete-btn" data-comment-id="${comment.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          `;
        }

        const replyInputHtml = isAdmin ? `
          <div class="reply-input-area" id="replyArea-${comment.id}" style="display:none; margin-top: 8px;">
            <textarea class="reply-input" placeholder="Write an admin response..." rows="2" style="width: 100%; border-radius: 8px; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); color: #fff;"></textarea>
            <button class="comment-send-btn reply-send-btn" data-comment-id="${comment.id}" style="margin-top: 6px; padding: 6px 12px;">Send Reply</button>
          </div>
        ` : '';

        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
          <div class="comment-header">
            <div class="comment-avatar">
              ${avatar ? `<img src="${avatar}" alt="${name}">` : `<i class="fas fa-user"></i>`}
            </div>
            <div class="comment-body">
              <div class="comment-meta-row">
                <span class="comment-name">${name}</span>
                <span class="comment-date">${date}</span>
              </div>
              <p class="comment-text">${comment.comment_text}</p>
              <div class="comment-actions">${actionsHtml}</div>
              ${replyInputHtml}
            </div>
          </div>
          ${repliesHtml ? `<div class="comment-replies">${repliesHtml}</div>` : ''}
        `;

        list.appendChild(item);
      }

      // Reply toggle
      document.querySelectorAll('.comment-reply-btn').forEach(btn => {
        btn.onclick = () => {
          const area = document.getElementById(`replyArea-${btn.dataset.commentId}`);
          if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
        };
      });

      // Delete comment
      document.querySelectorAll('.comment-delete-btn').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('Are you sure you want to delete this comment?')) return;
          const commentId = btn.dataset.commentId;
          const { error } = await window.supabase.from('comments').delete().eq('id', commentId);
          if (!error) {
            loadComments(tutorialId);
            const countEl = document.querySelector(`.comment-count[data-id="${tutorialId}"]`);
            if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || '1', 10) - 1);
            showToast('Comment deleted');
          }
        };
      });

      // Submit reply
      document.querySelectorAll('.reply-send-btn').forEach(btn => {
        btn.onclick = async () => {
          const commentId = btn.dataset.commentId;
          const area = document.getElementById(`replyArea-${commentId}`);
          const text = area?.querySelector('.reply-input')?.value.trim();
          if (!text) return;

          const { data: sd } = await window.supabase.auth.getSession();
          const { error } = await window.supabase.from('replies').insert({
            comment_id: commentId,
            admin_id: sd?.session?.user?.id,
            reply_text: text
          });

          if (!error) {
            showToast('Reply published!');
            loadComments(activeTutorialId);
          }
        };
      });
    } catch (e) {
      console.error('Comment load error:', e);
    }
  }

  // Send new comment
  document.getElementById('commentSendBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const input = document.getElementById('commentInput');
    const text = input?.value.trim();
    if (!text || !activeTutorialId) return;

    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;

    if (!user || user.email === null) {
      showToast('Please log in to post comments.');
      return;
    }

    const { error } = await window.supabase.from('comments').insert({
      tutorial_id: activeTutorialId,
      user_id: user.id,
      comment_text: text
    });

    if (!error) {
      input.value = '';
      loadComments(activeTutorialId);
      const countEl = document.querySelector(`.comment-count[data-id="${activeTutorialId}"]`);
      if (countEl) countEl.textContent = parseInt(countEl.textContent || '0', 10) + 1;
      showToast('Comment posted! 💬');
    } else {
      showToast('Failed to post: ' + error.message);
    }
  });

  // ==========================================
  // 11. TOAST HELPER
  // ==========================================
  function showToast(message) {
    if (window.showAuthToast) {
      window.showAuthToast(message);
      return;
    }

    const existing = document.getElementById('capToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'capToast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      background: rgba(18, 20, 28, 0.95); color: white; padding: 12px 24px; border-radius: 12px;
      z-index: 9999; border: 1px solid rgba(62, 207, 234, 0.3); font-family: 'Inter', sans-serif;
      font-size: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); backdrop-filter: blur(12px);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  // ==========================================
  // 12. SAVED FEED RENDER
  // ==========================================
  function renderSavedFeed(videos, startId) {
    renderVideos(videos);
    setTimeout(() => {
      const target = document.querySelector(`[data-id="${startId}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  window.renderSavedFeed = renderSavedFeed;

  // Initialize
  loadTutorials();
  updateSoundUI();
});