const BUCKET_NAME_USER = 'caphacksVideos'; // ← palitan kung iba yung bucket name mo

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. WAIT FOR SUPABASE + AUTH CHECK
  // ==========================================
  function waitForSupabase(callback) {
    if (window.supabase && window.supabase.auth) {
      callback();
    } else {
      setTimeout(() => waitForSupabase(callback), 100);
    }
  }

  waitForSupabase(async () => {
    const { data: sessionData } = await window.supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Guest users — redirect to home, dashboard is for accounts only
    if (user.email === null) {
      alert('Please create an account to access your dashboard.');
      window.location.href = 'index.html';
      return;
    }

    initUserDashboard(user);
  });

  async function initUserDashboard(user) {

    // ==========================================
    // 2. SIDEBAR USER INFO
    // ==========================================
    const dashName = document.getElementById('dashName');
    const dashEmail = document.getElementById('dashEmail');
    const dashAvatar = document.getElementById('dashAvatar');

    if (dashName) dashName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    if (dashEmail) dashEmail.textContent = user.email;

    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (dashAvatar) {
      dashAvatar.innerHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<i class="fas fa-user"></i>`;
    }

    // ==========================================
    // 3. SIDEBAR NAVIGATION
    // ==========================================
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

    // Mobile sidebar
    document.getElementById('sidebarOpenBtn')?.addEventListener('click', () => {
      document.querySelector('.dashboard-sidebar')?.classList.add('active');
    });
    document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => {
      document.querySelector('.dashboard-sidebar')?.classList.remove('active');
    });

    // Sign out
    document.getElementById('dashSignOutBtn')?.addEventListener('click', async () => {
      await window.supabase.auth.signOut();
      window.location.href = 'index.html';
    });

    // ==========================================
    // 4. UPLOAD PROOF MODAL
    // ==========================================
    const uploadProofModal = document.getElementById('uploadProofModal');
    const openUploadProofBtn = document.getElementById('openUploadProofBtn');
    const closeUploadProofBtn = document.getElementById('closeUploadProofBtn');
    const proofTutorialSelect = document.getElementById('proofTutorialSelect');

    openUploadProofBtn?.addEventListener('click', async () => {
      // Populate tutorials dropdown
      const { data: tutorials } = await window.supabase
        .from('tutorials')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (proofTutorialSelect) {
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

      if (uploadProofModal) {
        uploadProofModal.classList.add('active');
        uploadProofModal.setAttribute('aria-hidden', 'false');
      }
    });

    function closeProofModal() {
      if (uploadProofModal) {
        uploadProofModal.classList.remove('active');
        uploadProofModal.setAttribute('aria-hidden', 'true');
      }
      const proofError = document.getElementById('proofError');
      const proofProgress = document.getElementById('proofProgress');
      const proofBar = document.getElementById('proofBar');
      if (proofError) proofError.textContent = '';
      if (proofProgress) proofProgress.style.display = 'none';
      if (proofBar) proofBar.value = 0;
    }

    closeUploadProofBtn?.addEventListener('click', closeProofModal);

    // Click outside to close
    uploadProofModal?.addEventListener('click', (e) => {
      if (e.target === uploadProofModal) closeProofModal();
    });

    // Submit proof upload
    document.getElementById('submitProofBtn')?.addEventListener('click', async () => {
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
      if (statusEl) statusEl.textContent = 'Uploading your video...';
      if (progressBar) progressBar.value = 20;

      // Upload to storage
      const fileName = `user-${user.id}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: storageError } = await window.supabase.storage
        .from(BUCKET_NAME_USER)
        .upload(fileName, file);

      if (storageError) {
        if (errorEl) errorEl.textContent = 'Upload failed: ' + storageError.message;
        if (progressEl) progressEl.style.display = 'none';
        return;
      }

      if (progressBar) progressBar.value = 70;
      if (statusEl) statusEl.textContent = 'Saving to database...';

      const { data: urlData } = window.supabase.storage
        .from(BUCKET_NAME_USER)
        .getPublicUrl(fileName);

      // Insert to user_videos table
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
      if (statusEl) statusEl.textContent = 'Uploaded successfully!';

      setTimeout(() => {
        closeProofModal();
        loadMyUploads(user.id);
      }, 1200);
    });

    // ==========================================
    // 5. INITIAL LOAD
    // ==========================================
    loadLikedVideos(user.id);

    // ==========================================
    // 6. DATA LOADERS
    // ==========================================
    async function loadLikedVideos(userId) {
      const grid = document.getElementById('likedGrid');
      if (!grid) return;
      grid.innerHTML = '<p class="loading-text">Loading liked videos...</p>';

      // session_id for logged-in users = their user.id (set by cookies.js migration)
      const { data: likes, error } = await window.supabase
        .from('ratings')
        .select('tutorial_id')
        .eq('session_id', userId);

      if (error) {
        grid.innerHTML = `<p class="empty-state">Error loading liked videos.</p>`;
        return;
      }

      if (!likes || likes.length === 0) {
        grid.innerHTML = '<p class="empty-state">No liked videos yet. Go watch some tutorials!</p>';
        return;
      }

      const tutorialIds = [...new Set(likes.map(l => l.tutorial_id).filter(Boolean))];
      if (tutorialIds.length === 0) {
        grid.innerHTML = '<p class="empty-state">No liked videos yet.</p>';
        return;
      }

      const { data: videos } = await window.supabase
        .from('tutorials')
        .select('*')
        .in('id', tutorialIds);

      renderVideoGrid(grid, videos, false);
    }

    async function loadSavedVideos(userId) {
      const grid = document.getElementById('savedGrid');
      if (!grid) return;
      grid.innerHTML = '<p class="loading-text">Loading saved videos...</p>';

      const { data: saves, error } = await window.supabase
        .from('progress')
        .select('tutorial_id')
        .eq('session_id', userId);

      if (error) {
        grid.innerHTML = `<p class="empty-state">Error loading saved videos.</p>`;
        return;
      }

      if (!saves || saves.length === 0) {
        grid.innerHTML = '<p class="empty-state">No saved videos yet. Bookmark something from the feed!</p>';
        return;
      }

      const tutorialIds = [...new Set(saves.map(s => s.tutorial_id).filter(Boolean))];
      if (tutorialIds.length === 0) {
        grid.innerHTML = '<p class="empty-state">No saved videos yet.</p>';
        return;
      }

      const { data: videos } = await window.supabase
        .from('tutorials')
        .select('*')
        .in('id', tutorialIds);

      renderVideoGrid(grid, videos, false);
    }

    async function loadMyUploads(userId) {
      const grid = document.getElementById('uploadsGrid');
      if (!grid) return;
      grid.innerHTML = '<p class="loading-text">Loading your uploads...</p>';

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
          <div class="empty-state" style="grid-column:1/-1; text-align:center; padding:40px; color:#aaa;">
            <i class="fas fa-video" style="font-size:32px; margin-bottom:12px; display:block; opacity:0.4;"></i>
            <p>You haven't uploaded any proof of learning yet.</p>
            <p style="font-size:13px; margin-top:8px;">Watch a tutorial, practice the technique, then upload your edit!</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      uploads.forEach(upload => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const tutTitle = upload.tutorials?.title || 'Unknown Tutorial';
        const date = new Date(upload.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        card.innerHTML = `
          <div class="video-card-thumbnail" style="aspect-ratio:9/16; background:#000; overflow:hidden;">
            <video src="${upload.video_url}" muted playsinline preload="metadata"
              style="width:100%; height:100%; object-fit:cover;"></video>
          </div>
          <div class="video-card-info">
            <h3 class="video-card-title" style="font-size:13px; margin-bottom:4px;">
              Proof for: <span style="color:#3ecfea;">${tutTitle}</span>
            </h3>
            <div class="video-card-meta">
              <span style="color:#888; font-size:11px;">${date}</span>
            </div>
            <div class="video-card-actions" style="margin-top:10px;">
              <button class="card-btn danger"
                style="width:100%; padding:8px; background:rgba(255,45,85,0.15);
                border:1px solid rgba(255,45,85,0.3); color:#ff2d55; border-radius:6px;
                cursor:pointer; font-size:12px; font-family:'Inter',sans-serif;"
                onclick="deleteMyUpload('${upload.id}', '${upload.video_filename || ''}', '${userId}')">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `;

        const videoEl = card.querySelector('video');
        card.addEventListener('mouseenter', () => videoEl.play().catch(e => e));
        card.addEventListener('mouseleave', () => { videoEl.pause(); videoEl.currentTime = 0; });

        grid.appendChild(card);
      });
    }

    // Make loadMyUploads accessible globally for delete
    window._loadMyUploads = loadMyUploads;
    window._userId = user.id;

    // ==========================================
    // RENDER VIDEO GRID (Liked & Saved)
    // ==========================================
    function renderVideoGrid(gridElement, videos) {
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
          <div class="video-card-thumbnail" style="aspect-ratio:9/16; background:#000; overflow:hidden; position:relative;">
            <video src="${video.video_url}" muted playsinline preload="metadata"
              style="width:100%; height:100%; object-fit:cover;"></video>
            <span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.7);
              color:white; font-size:10px; padding:3px 8px; border-radius:4px; font-weight:600;">
              ${video.category || 'Basic'}
            </span>
          </div>
          <div class="video-card-info">
            <h3 class="video-card-title">${video.title}</h3>
            <div class="video-card-meta">
              <span style="color:#888; font-size:11px;">${date}</span>
            </div>
            <div class="video-card-actions" style="margin-top:10px;">
              <a href="video-hacks.html"
                style="display:block; text-align:center; padding:8px; background:rgba(255,255,255,0.08);
                border:none; border-radius:6px; color:white; font-size:12px;
                font-family:'Inter',sans-serif; text-decoration:none; transition:background 0.2s;"
                onmouseover="this.style.background='rgba(255,255,255,0.15)'"
                onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                <i class="fas fa-play"></i> Watch Again
              </a>
            </div>
          </div>
        `;

        const videoEl = card.querySelector('video');
        card.addEventListener('mouseenter', () => videoEl.play().catch(e => e));
        card.addEventListener('mouseleave', () => { videoEl.pause(); videoEl.currentTime = 0; });

        gridElement.appendChild(card);
      });
    }
  }

  // ==========================================
  // GLOBAL DELETE USER UPLOAD
  // ==========================================
  window.deleteMyUpload = async function(uploadId, videoFilename, userId) {
    if (!confirm('Delete this upload? This cannot be undone.')) return;

    // Remove from storage
    if (videoFilename) {
      await window.supabase.storage.from(BUCKET_NAME_USER).remove([videoFilename]);
    }

    const { error } = await window.supabase.from('user_videos').delete().eq('id', uploadId);
    if (error) { alert('Error: ' + error.message); return; }

    // Reload uploads
    if (window._loadMyUploads && window._userId) {
      window._loadMyUploads(window._userId);
    }
  };

});