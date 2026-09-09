// Admin Dashboard Engine - CapHacks
const BUCKET_NAME = 'caphacksVideos';

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

      const isAdmin = window.isAdminUser ? window.isAdminUser(user) : false;

      if (!user || !isAdmin) {
        alert('Access denied. Administrator privileges required.');
        window.location.href = 'index.html';
        return;
      }

      initAdminDashboard(user);
    } catch (e) {
      console.error('Admin auth check error:', e);
      window.location.href = 'index.html';
    }
  });

  async function initAdminDashboard(user) {
    // 1. Sidebar User Info
    const dashName = document.getElementById('dashName');
    const dashEmail = document.getElementById('dashEmail');
    const dashAvatar = document.getElementById('dashAvatar');

    if (dashName) dashName.textContent = user.user_metadata?.full_name || 'Admin';
    if (dashEmail) dashEmail.textContent = user.email;

    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (dashAvatar) {
      dashAvatar.innerHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="avatar">`
        : `<i class="fas fa-user-shield"></i>`;
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

        if (targetId === 'manageTutorials') loadManageTutorials();
        if (targetId === 'manageUserUploads') loadUserUploads();
        if (targetId === 'analytics') loadAnalytics();

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

    // 3. Upload Form Submission
    const uploadForm = document.getElementById('adminUploadForm');
    uploadForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleTutorialUpload(user);
    });

    // 4. Initial Section Load
    loadManageTutorials();
  }

  // ==========================================
  // TUTORIAL UPLOAD HANDLER
  // ==========================================
  async function handleTutorialUpload(user) {
    const title = document.getElementById('uploadTitle')?.value.trim();
    const description = document.getElementById('uploadDescription')?.value.trim();
    const category = document.getElementById('uploadCategory')?.value;
    const tags = document.getElementById('uploadTags')?.value.trim();
    const fileInput = document.getElementById('uploadFile');
    const file = fileInput?.files[0];

    const errorEl = document.getElementById('uploadError');
    const successEl = document.getElementById('uploadSuccess');
    const progressEl = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadBar');
    const progressStatus = document.getElementById('uploadStatus');
    const submitBtn = document.getElementById('uploadSubmitBtn');

    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    if (!title) { if (errorEl) errorEl.textContent = 'Tutorial title is required.'; return; }
    if (!file) { if (errorEl) errorEl.textContent = 'Please select a video file.'; return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...'; }
    if (progressEl) progressEl.style.display = 'block';
    if (progressStatus) progressStatus.textContent = 'Uploading video to storage...';
    if (progressBar) progressBar.value = 30;

    const fileName = `tut-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error: storageError } = await window.supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);

    if (storageError) {
      if (errorEl) errorEl.textContent = 'Storage upload failed: ' + storageError.message;
      if (progressEl) progressEl.style.display = 'none';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Video Hack'; }
      return;
    }

    if (progressBar) progressBar.value = 75;
    if (progressStatus) progressStatus.textContent = 'Saving tutorial metadata...';

    const { data: urlData } = window.supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    const { error: dbError } = await window.supabase.from('tutorials').insert({
      title,
      description: description || '',
      category: category || 'Basic',
      tags: tags || '',
      video_url: videoUrl,
      video_filename: fileName,
    });

    if (dbError) {
      if (errorEl) errorEl.textContent = 'Database record failed: ' + dbError.message;
      if (progressEl) progressEl.style.display = 'none';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Video Hack'; }
      return;
    }

    if (progressBar) progressBar.value = 100;
    if (progressStatus) progressStatus.textContent = 'Upload Complete!';
    if (successEl) successEl.textContent = `✅ "${title}" published successfully!`;

    setTimeout(() => {
      document.getElementById('adminUploadForm')?.reset();
      if (progressEl) progressEl.style.display = 'none';
      if (progressBar) progressBar.value = 0;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Video Hack'; }
      if (successEl) successEl.textContent = '';
      loadManageTutorials();
    }, 1800);
  }

  // ==========================================
  // MANAGE TUTORIALS
  // ==========================================
  async function loadManageTutorials() {
    const grid = document.getElementById('manageGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-text">Loading tutorial library...</p>';

    const { data: tutorials, error } = await window.supabase
      .from('tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="empty-state">Error loading tutorials: ${error.message}</p>`;
      return;
    }

    if (!tutorials || tutorials.length === 0) {
      grid.innerHTML = '<p class="empty-state">No tutorials published yet. Upload your first one above!</p>';
      return;
    }

    grid.innerHTML = '';
    tutorials.forEach(tutorial => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const date = new Date(tutorial.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      card.innerHTML = `
        <div class="video-card-thumbnail">
          <video src="${tutorial.video_url}" muted playsinline preload="metadata"></video>
        </div>
        <div class="video-card-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="badge" style="font-size:10px;">${tutorial.category || 'Basic'}</span>
            <span style="font-size:11px; color:var(--text-muted);">${date}</span>
          </div>
          <h3 class="video-card-title">${tutorial.title}</h3>
          <div class="video-card-actions">
            <button class="card-btn danger" onclick="deleteTutorial('${tutorial.id}', '${tutorial.title.replace(/'/g, "\\'")}', '${tutorial.video_filename || ''}')">
              <i class="fas fa-trash"></i> Delete
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

  // Global Delete Tutorial Function
  window.deleteTutorial = async function (tutorialId, tutorialTitle, videoFilename) {
    if (!confirm(`Delete tutorial "${tutorialTitle}"? This will also remove ratings and comments. This cannot be undone.`)) return;

    if (videoFilename) {
      await window.supabase.storage.from(BUCKET_NAME).remove([videoFilename]);
    }

    const { error } = await window.supabase.from('tutorials').delete().eq('id', tutorialId);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }

    loadManageTutorials();
  };

  // ==========================================
  // MANAGE USER UPLOADS
  // ==========================================
  async function loadUserUploads() {
    const grid = document.getElementById('userUploadsGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-text">Loading creator submissions...</p>';

    const { data: uploads, error } = await window.supabase
      .from('user_videos')
      .select('*, tutorials(title), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="empty-state">Error: ${error.message}</p>`;
      return;
    }

    if (!uploads || uploads.length === 0) {
      grid.innerHTML = '<p class="empty-state">No creator proof edits uploaded yet.</p>';
      return;
    }

    grid.innerHTML = '';
    uploads.forEach(upload => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const tutTitle = upload.tutorials?.title || 'Unknown Tutorial';
      const userName = upload.profiles?.full_name || 'Creator';
      const date = new Date(upload.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      card.innerHTML = `
        <div class="video-card-thumbnail">
          <video src="${upload.video_url}" muted playsinline preload="metadata"></video>
        </div>
        <div class="video-card-info">
          <h3 class="video-card-title"><span style="color:var(--primary-color);">${userName}</span></h3>
          <p style="font-size:12px; color:var(--text-secondary); margin:2px 0;">For: ${tutTitle}</p>
          <div class="video-card-meta"><span>${date}</span></div>
          <div class="video-card-actions">
            <button class="card-btn danger" onclick="adminDeleteUpload('${upload.id}', '${upload.video_filename || ''}')">
              <i class="fas fa-trash"></i> Remove
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

  window.adminDeleteUpload = async function (uploadId, videoFilename) {
    if (!confirm('Remove this user proof edit?')) return;

    if (videoFilename) {
      await window.supabase.storage.from(BUCKET_NAME).remove([videoFilename]);
    }

    const { error } = await window.supabase.from('user_videos').delete().eq('id', uploadId);
    if (error) {
      alert('Error removing upload: ' + error.message);
      return;
    }

    loadUserUploads();
  };

  // ==========================================
  // REAL-TIME ANALYTICS
  // ==========================================
  async function loadAnalytics() {
    const statTotal = document.getElementById('statTotal');
    const statBasic = document.getElementById('statBasic');
    const statIntermediate = document.getElementById('statIntermediate');
    const statAdvance = document.getElementById('statAdvance');
    const statUserUploads = document.getElementById('statUserUploads');
    const statRatings = document.getElementById('statRatings');
    const statComments = document.getElementById('statComments');

    try {
      const { count: total } = await window.supabase.from('tutorials').select('id', { count: 'exact' });
      if (statTotal) statTotal.textContent = total || 0;

      const { count: basic } = await window.supabase.from('tutorials').select('id', { count: 'exact' }).eq('category', 'Basic');
      if (statBasic) statBasic.textContent = basic || 0;

      const { count: intermediate } = await window.supabase.from('tutorials').select('id', { count: 'exact' }).eq('category', 'Intermediate');
      if (statIntermediate) statIntermediate.textContent = intermediate || 0;

      const { count: advance } = await window.supabase.from('tutorials').select('id', { count: 'exact' }).eq('category', 'Advance');
      if (statAdvance) statAdvance.textContent = advance || 0;

      const { count: userProofs } = await window.supabase.from('user_videos').select('id', { count: 'exact' });
      if (statUserUploads) statUserUploads.textContent = userProofs || 0;

      const { count: ratingsCount } = await window.supabase.from('ratings').select('id', { count: 'exact' });
      if (statRatings) statRatings.textContent = ratingsCount || 0;

      const { count: commentsCount } = await window.supabase.from('comments').select('id', { count: 'exact' });
      if (statComments) statComments.textContent = commentsCount || 0;
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }
});