// User Dashboard Engine - CapHacks
const BUCKET_NAME_USER = 'caphacksVideos';

document.addEventListener('DOMContentLoaded', async () => {
  function waitForSupabase(callback) {
    if (window.supabase && window.supabase.auth) {
      callback();
    } else {
      setTimeout(() => waitForSupabase(callback), 80);
    }
  }

  waitForSupabase(async () => {
    try {
      const { data: sessionData } = await window.supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user || user.email === null) {
        alert('Please log in or create an account to access the creator dashboard.');
        window.location.href = 'index.html';
        return;
      }

      initUserDashboard(user);
    } catch (e) {
      console.error('User dashboard init error:', e);
      window.location.href = 'index.html';
    }
  });

  async function initUserDashboard(user) {
    // 1. Sidebar User Info
    const dashName = document.getElementById('dashName');
    const dashEmail = document.getElementById('dashEmail');
    const dashAvatar = document.getElementById('dashAvatar');

    if (dashName) dashName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    if (dashEmail) dashEmail.textContent = user.email;

    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (dashAvatar) {
      dashAvatar.innerHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="avatar">`
        : `<i class="fas fa-user"></i>`;
    }

    // 2. Sidebar Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        const targetId = item.dataset.target;
        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');

        if (targetId === 'likedVideos') loadLikedVideos(user.id);
        if (targetId === 'savedVideos') loadSavedVideos(user.id);
        if (targetId === 'myUploads') loadMyUploads(user.id);

        document.querySelector('.dashboard-sidebar')?.classList.remove('active');
      });
    });

    // Mobile Sidebar Toggles
    document.getElementById('sidebarOpenBtn')?.addEventListener('click', () => {
      document.querySelector('.dashboard-sidebar')?.classList.add('active');
    });
    document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => {
      document.querySelector('.dashboard-sidebar')?.classList.remove('active');
    });

    // Sign Out
    document.getElementById('dashSignOutBtn')?.addEventListener('click', async () => {
      await window.supabase.auth.signOut();
      window.location.href = 'index.html';
    });

    // 3. Upload Proof Modal Logic
    const uploadProofModal = document.getElementById('uploadProofModal');
    const openUploadProofBtn = document.getElementById('openUploadProofBtn');
    const closeUploadProofBtn = document.getElementById('closeUploadProofBtn');
    const proofTutorialSelect = document.getElementById('proofTutorialSelect');

    openUploadProofBtn?.addEventListener('click', async () => {
      if (proofTutorialSelect) {
        proofTutorialSelect.innerHTML = '<option value="">Loading tutorials...</option>';
        const { data: tutorials } = await window.supabase
          .from('tutorials')
          .select('id, title')
          .order('created_at', { ascending: false });

        proofTutorialSelect.innerHTML = '<option value="">Select a tutorial...</option>';
        if (tutorials) {
          tutorials.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title;
            proofTutorialSelect.appendChild(opt);
          });
        }
      }

      uploadProofModal?.classList.add('active');
    });

    function closeProofModal() {
      uploadProofModal?.classList.remove('active');
      const proofError = document.getElementById('proofError');
      const proofProgress = document.getElementById('proofProgress');
      const proofBar = document.getElementById('proofBar');
      if (proofError) proofError.textContent = '';
      if (proofProgress) proofProgress.style.display = 'none';
      if (proofBar) proofBar.value = 0;
    }

    closeUploadProofBtn?.addEventListener('click', closeProofModal);
    uploadProofModal?.addEventListener('click', (e) => {
      if (e.target === uploadProofModal) closeProofModal();
    });

    // Submit Proof of Learning Upload
    document.getElementById('submitProofBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const tutId = proofTutorialSelect?.value;
      const fileInput = document.getElementById('proofFile');
      const file = fileInput?.files[0];
      const errorEl = document.getElementById('proofError');
      const progressEl = document.getElementById('proofProgress');
      const progressBar = document.getElementById('proofBar');
      const statusEl = document.getElementById('proofStatus');

      if (errorEl) errorEl.textContent = '';

      if (!tutId) { if (errorEl) errorEl.textContent = 'Please select a tutorial.'; return; }
      if (!file) { if (errorEl) errorEl.textContent = 'Please select a video file.'; return; }

      if (progressEl) progressEl.style.display = 'block';
      if (statusEl) statusEl.textContent = 'Uploading your video edit...';
      if (progressBar) progressBar.value = 25;

      const fileName = `user-${user.id}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: storageError } = await window.supabase.storage
        .from(BUCKET_NAME_USER)
        .upload(fileName, file);

      if (storageError) {
        if (errorEl) errorEl.textContent = 'Upload failed: ' + storageError.message;
        if (progressEl) progressEl.style.display = 'none';
        return;
      }

      if (progressBar) progressBar.value = 75;
      if (statusEl) statusEl.textContent = 'Saving edit details...';

      const { data: urlData } = window.supabase.storage
        .from(BUCKET_NAME_USER)
        .getPublicUrl(fileName);

      const { error: dbError } = await window.supabase.from('user_videos').insert({
        user_id: user.id,
        tutorial_id: tutId,
        video_url: urlData.publicUrl,
        video_filename: fileName,
        title: `Proof upload by ${user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}`
      });

      if (dbError) {
        if (errorEl) errorEl.textContent = 'Database error: ' + dbError.message;
        if (progressEl) progressEl.style.display = 'none';
        return;
      }

      if (progressBar) progressBar.value = 100;
      if (statusEl) statusEl.textContent = 'Upload complete! Well done!';

      setTimeout(() => {
        closeProofModal();
        loadMyUploads(user.id);
      }, 1000);
    });

    // 4. Initial Section Load
    loadLikedVideos(user.id);

    // 5. Data Loaders
    async function loadLikedVideos(userId) {
      const grid = document.getElementById('likedGrid');
      if (!grid) return;
      grid.innerHTML = '<p class="loading-text">Loading liked hacks...</p>';

      const { data: likes, error } = await window.supabase
        .from('ratings')
        .select('tutorial_id')
        .eq('session_id', userId);

      if (error) {
        grid.innerHTML = `<p class="empty-state">Error loading liked videos: ${error.message}</p>`;
        return;
      }

      if (!likes || likes.length === 0) {
        grid.innerHTML = '<p class="empty-state">No liked hacks yet. Explore the feed and star your favorites!</p>';
        return;
      }

      const tutorialIds = [...new Set(likes.map(l => l.tutorial_id).filter(Boolean))];
      if (tutorialIds.length === 0) {
        grid.innerHTML = '<p class="empty-state">No liked hacks yet.</p>';
        return;
      }

      const { data: videos } = await window.supabase
        .from('tutorials')
        .select('*')
        .in('id', tutorialIds);

      renderVideoCards(grid, videos);
    }

    async function loadSavedVideos(userId) {
      const grid = document.getElementById('savedGrid');
      if (!grid) return;
      grid.innerHTML = '<p class="loading-text">Loading saved hacks...</p>';

      const { data: saves, error } = await window.supabase
        .from('progress')
        .select('tutorial_id')
        .eq('session_id', userId);

      if (error) {
        grid.innerHTML = `<p class="empty-state">Error loading saved videos: ${error.message}</p>`;
        return;
      }

      if (!saves || saves.length === 0) {
        grid.innerHTML = '<p class="empty-state">No saved hacks yet. Bookmark tutorials from the feed!</p>';
        return;
      }

      const tutorialIds = [...new Set(saves.map(s => s.tutorial_id).filter(Boolean))];
      if (tutorialIds.length === 0) {
        grid.innerHTML = '<p class="empty-state">No saved hacks yet.</p>';
        return;
      }

      const { data: videos } = await window.supabase
        .from('tutorials')
        .select('*')
        .in('id', tutorialIds);

      renderVideoCards(grid, videos);
    }

    async function loadMyUploads(userId) {
      const grid = document.getElementById('uploadsGrid');
      if (!grid) return;
      grid.innerHTML = '<p class="loading-text">Loading your proof uploads...</p>';

      const { data: uploads, error } = await window.supabase
        .from('user_videos')
        .select('*, tutorials(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        grid.innerHTML = `<p class="empty-state">Error: ${error.message}</p>`;
        return;
      }

      if (!uploads || uploads.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-video" style="font-size:36px; margin-bottom:12px; display:block; opacity:0.4;"></i>
            <p>You haven't uploaded any proof of learning yet.</p>
            <p style="font-size:13px; margin-top:6px; color:var(--text-muted);">Watch a tutorial, practice the hack in CapCut, then click "Upload Proof"!</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      uploads.forEach(upload => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const tutTitle = upload.tutorials?.title || 'Tutorial Hack';
        const date = new Date(upload.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        card.innerHTML = `
          <div class="video-card-thumbnail">
            <video src="${upload.video_url}" muted playsinline preload="metadata"></video>
          </div>
          <div class="video-card-info">
            <h3 class="video-card-title">Proof for: <span style="color:var(--primary-color);">${tutTitle}</span></h3>
            <div class="video-card-meta"><span>${date}</span></div>
            <div class="video-card-actions">
              <button class="card-btn danger" onclick="deleteMyUpload('${upload.id}', '${upload.video_filename || ''}')">
                <i class="fas fa-trash"></i> Delete Edit
              </button>
            </div>
          </div>
        `;

        const videoEl = card.querySelector('video');
        card.addEventListener('mouseenter', () => videoEl?.play().catch(() => {}));
        card.addEventListener('mouseleave', () => {
          if (videoEl) { videoEl.pause(); videoEl.currentTime = 0; }
        });

        grid.appendChild(card);
      });
    }

    function renderVideoCards(gridElement, videos) {
      if (!videos || videos.length === 0) {
        gridElement.innerHTML = '<p class="empty-state">No videos found.</p>';
        return;
      }

      gridElement.innerHTML = '';
      videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const date = new Date(video.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        card.innerHTML = `
          <div class="video-card-thumbnail">
            <video src="${video.video_url}" muted playsinline preload="metadata"></video>
          </div>
          <div class="video-card-info">
            <h3 class="video-card-title">${video.title}</h3>
            <div class="video-card-meta"><span>${date}</span></div>
            <div class="video-card-actions">
              <a href="video-hacks.html?video=${video.id}" class="card-btn">
                <i class="fas fa-play"></i> Watch Hack
              </a>
            </div>
          </div>
        `;

        const videoEl = card.querySelector('video');
        card.addEventListener('mouseenter', () => videoEl?.play().catch(() => {}));
        card.addEventListener('mouseleave', () => {
          if (videoEl) { videoEl.pause(); videoEl.currentTime = 0; }
        });

        gridElement.appendChild(card);
      });
    }

    window._loadMyUploads = loadMyUploads;
    window._userId = user.id;
  }

  window.deleteMyUpload = async function (uploadId, videoFilename) {
    if (!confirm('Are you sure you want to delete this edit? This action cannot be undone.')) return;

    if (videoFilename) {
      await window.supabase.storage.from(BUCKET_NAME_USER).remove([videoFilename]);
    }

    const { error } = await window.supabase.from('user_videos').delete().eq('id', uploadId);
    if (error) {
      alert('Error deleting: ' + error.message);
      return;
    }

    if (window._loadMyUploads && window._userId) {
      window._loadMyUploads(window._userId);
    }
  };
});