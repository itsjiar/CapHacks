// ==========================================
// ADMIN EMAILS — palitan ng actual emails ninyo


const BUCKET_NAME = 'caphacksVideos'; // ← palitan kung iba yung bucket name mo

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. AUTH CHECK — Admin only
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

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      alert('Access denied. Admins only.');
      window.location.href = 'index.html';
      return;
    }

    initDashboard(user);
  });

  async function initDashboard(user) {

    // ==========================================
    // 2. SIDEBAR USER INFO
    // ==========================================
    const dashName = document.getElementById('dashName');
    const dashEmail = document.getElementById('dashEmail');
    const dashAvatar = document.getElementById('dashAvatar');

    if (dashName) dashName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
    if (dashEmail) dashEmail.textContent = user.email;

    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (dashAvatar) {
      dashAvatar.innerHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<i class="fas fa-user-shield"></i>`;
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

        if (targetId === 'manageTutorials') loadManageTutorials();
        if (targetId === 'manageUserUploads') loadUserUploads();
        if (targetId === 'analytics') loadAnalytics();

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
    // 4. UPLOAD TUTORIAL
    // ==========================================
    const uploadForm = document.getElementById('adminUploadForm');
    const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');

    // File input label update
    const fileInput = document.getElementById('uploadFile') || document.getElementById('aFile');
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const fileNameEl = document.getElementById('fileName');
        if (fileNameEl && fileInput.files[0]) {
          fileNameEl.textContent = `Selected: ${fileInput.files[0].name}`;
        }
      });
    }

    if (uploadSubmitBtn) {
      uploadSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleUpload(user);
      });
    }

    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUpload(user);
      });
    }

    // Load initial section
    loadManageTutorials();
  }

  // ==========================================
  // UPLOAD HANDLER
  // ==========================================
  async function handleUpload(user) {
    const title = (document.getElementById('uploadTitle') || document.getElementById('aTitle'))?.value.trim();
    const description = (document.getElementById('uploadDescription') || document.getElementById('aDescription'))?.value.trim();
    const category = (document.getElementById('uploadCategory') || document.getElementById('aCategory'))?.value;
    const tags = (document.getElementById('uploadTags') || document.getElementById('aTags'))?.value.trim();
    const fileInput = document.getElementById('uploadFile') || document.getElementById('aFile');
    const file = fileInput?.files[0];

    const errorEl = document.getElementById('uploadError');
    const successEl = document.getElementById('uploadSuccess');
    const progressEl = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressLabel = document.getElementById('progressLabel') || document.getElementById('uploadStatus');

    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    if (!title) { if (errorEl) errorEl.textContent = 'Title is required.'; return; }
    if (!file) { if (errorEl) errorEl.textContent = 'Please select a video file.'; return; }

    const submitBtn = document.getElementById('uploadSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading...'; }

    if (progressEl) progressEl.style.display = 'block';
    if (progressLabel) progressLabel.textContent = 'Uploading video to storage...';
    if (progressFill) progressFill.style.width = '30%';

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error: storageError } = await window.supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);

    if (storageError) {
      if (errorEl) errorEl.textContent = 'Upload failed: ' + storageError.message;
      if (progressEl) progressEl.style.display = 'none';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Upload Tutorial'; }
      return;
    }

    if (progressFill) progressFill.style.width = '70%';
    if (progressLabel) progressLabel.textContent = 'Saving to database...';

    // Get public URL
    const { data: urlData } = window.supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    // Insert to tutorials table
    const { error: dbError } = await window.supabase.from('tutorials').insert({
      title,
      description: description || '',
      category: category || 'Basic',
      tags: tags || '',
      video_url: videoUrl,
      video_filename: fileName,
    });

    if (dbError) {
      if (errorEl) errorEl.textContent = 'Database error: ' + dbError.message;
      if (progressEl) progressEl.style.display = 'none';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Upload Tutorial'; }
      return;
    }

    if (progressFill) progressFill.style.width = '100%';
    if (progressLabel) progressLabel.textContent = 'Upload complete!';
    if (successEl) successEl.textContent = `✅ "${title}" uploaded successfully!`;

    // Reset form
    setTimeout(() => {
      document.getElementById('adminUploadForm')?.reset();
      const fileNameEl = document.getElementById('fileName');
      if (fileNameEl) fileNameEl.textContent = '';
      if (progressEl) progressEl.style.display = 'none';
      if (progressFill) progressFill.style.width = '0%';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Upload Tutorial'; }
      if (successEl) successEl.textContent = '';
    }, 2500);
  }

  // ==========================================
  // MANAGE TUTORIALS
  // ==========================================
  async function loadManageTutorials() {
    const grid = document.getElementById('manageGrid');
    const tableBody = document.getElementById('tutorialsTableBody');
    const tableEl = document.getElementById('tutorialsTable');
    const loadingEl = document.getElementById('tutorialsLoading');
    const emptyEl = document.getElementById('tutorialsEmpty');

    // Support both grid and table layout
    const container = grid || tableBody;
    if (!container) return;

    if (grid) grid.innerHTML = '<p class="loading-text">Loading tutorials...</p>';
    if (loadingEl) loadingEl.style.display = 'block';
    if (tableEl) tableEl.style.display = 'none';

    const { data: tutorials, error } = await window.supabase
      .from('tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (grid) grid.innerHTML = `<p class="loading-text">Error loading tutorials: ${error.message}</p>`;
      if (loadingEl) loadingEl.textContent = 'Error: ' + error.message;
      return;
    }

    if (!tutorials || tutorials.length === 0) {
      if (grid) grid.innerHTML = '<p class="empty-state">No tutorials yet. Upload your first one!</p>';
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'flex';
      return;
    }

    // If using grid layout
    if (grid) {
      grid.innerHTML = '';
      tutorials.forEach(tutorial => {
        const card = createTutorialCard(tutorial);
        grid.appendChild(card);
      });
      return;
    }

    // If using table layout
    if (tableBody && tableEl) {
      if (loadingEl) loadingEl.style.display = 'none';
      tableEl.style.display = 'table';
      tableBody.innerHTML = '';

      for (const tutorial of tutorials) {
        const { count: rateCount } = await window.supabase
          .from('ratings').select('id', { count: 'exact' }).eq('tutorial_id', tutorial.id);
        const { count: commentCount } = await window.supabase
          .from('comments').select('id', { count: 'exact' }).eq('tutorial_id', tutorial.id);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${tutorial.title}</td>
          <td><span class="category-badge ${tutorial.category?.toLowerCase()}">${tutorial.category}</span></td>
          <td>${rateCount || 0}</td>
          <td>${commentCount || 0}</td>
          <td>${new Date(tutorial.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
          <td>
            <button class="card-btn danger" onclick="deleteTutorial('${tutorial.id}', '${tutorial.title}', '${tutorial.video_filename || ''}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      }
    }
  }

  function createTutorialCard(tutorial) {
    const card = document.createElement('div');
    card.className = 'video-card';
    const date = new Date(tutorial.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    card.innerHTML = `
      <div class="video-card-thumbnail" style="aspect-ratio: 9/16; background:#000; position:relative; overflow:hidden;">
        <video src="${tutorial.video_url}" muted playsinline preload="metadata"
          style="width:100%; height:100%; object-fit:cover;"></video>
        <span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.7);
          color:white; font-size:10px; padding:3px 8px; border-radius:4px; font-weight:600;">
          ${tutorial.category || 'Basic'}
        </span>
      </div>
      <div class="video-card-info">
        <h3 class="video-card-title">${tutorial.title}</h3>
        <div class="video-card-meta">
          <span style="color:#aaa; font-size:12px;">${date}</span>
        </div>
        <div class="video-card-actions" style="margin-top:10px; display:flex; gap:8px;">
          <button class="card-btn danger" style="flex:1; padding:8px; background:rgba(255,45,85,0.15);
            border:1px solid rgba(255,45,85,0.3); color:#ff2d55; border-radius:6px;
            cursor:pointer; font-size:12px; font-family:'Inter',sans-serif;"
            onclick="deleteTutorial('${tutorial.id}', '${tutorial.title.replace(/'/g, "\\'")}', '${tutorial.video_filename || ''}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;

    // Hover preview
    const videoEl = card.querySelector('video');
    card.addEventListener('mouseenter', () => videoEl.play().catch(e => e));
    card.addEventListener('mouseleave', () => { videoEl.pause(); videoEl.currentTime = 0; });

    return card;
  }

  // Global delete tutorial function
  window.deleteTutorial = async function(tutorialId, tutorialTitle, videoFilename) {
    if (!confirm(`Delete "${tutorialTitle}"? This will also remove all ratings, comments, and saves. Cannot be undone.`)) return;

    // Delete from storage if filename exists
    if (videoFilename) {
      await window.supabase.storage.from(BUCKET_NAME).remove([videoFilename]);
    }

    const { error } = await window.supabase.from('tutorials').delete().eq('id', tutorialId);

    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }

    showToast('Tutorial deleted successfully.');
    loadManageTutorials();
  };

  // ==========================================
  // USER UPLOADS (Proof of Learning)
  // ==========================================
  async function loadUserUploads() {
    const grid = document.getElementById('userUploadsGrid');
    if (!grid) return;

    grid.innerHTML = '<p class="loading-text">Loading user uploads...</p>';

    const { data: uploads, error } = await window.supabase
      .from('user_videos')
      .select('*, tutorials(title), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="loading-text">Error: ${error.message}</p>`;
      return;
    }

    if (!uploads || uploads.length === 0) {
      grid.innerHTML = '<p class="empty-state">No user uploads yet.</p>';
      return;
    }

    grid.innerHTML = '';
    uploads.forEach(upload => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const tutTitle = upload.tutorials?.title || 'Unknown Tutorial';
      const userName = upload.profiles?.full_name || 'User';
      const date = new Date(upload.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      card.innerHTML = `
        <div class="video-card-thumbnail" style="aspect-ratio:9/16; background:#000; overflow:hidden;">
          <video src="${upload.video_url}" muted playsinline preload="metadata"
            style="width:100%; height:100%; object-fit:cover;"></video>
        </div>
        <div class="video-card-info">
          <h3 class="video-card-title" style="font-size:13px;">
            <span style="color:#3ecfea;">${userName}</span> — Proof for:
          </h3>
          <p style="font-size:12px; color:#aaa; margin:4px 0;">${tutTitle}</p>
          <div class="video-card-meta">
            <span style="color:#888; font-size:11px;">${date}</span>
          </div>
          <div class="video-card-actions" style="margin-top:10px;">
            <button class="card-btn danger" style="width:100%; padding:8px;
              background:rgba(255,45,85,0.15); border:1px solid rgba(255,45,85,0.3);
              color:#ff2d55; border-radius:6px; cursor:pointer; font-size:12px; font-family:'Inter',sans-serif;"
              onclick="adminDeleteUpload('${upload.id}', '${upload.video_filename || ''}')">
              <i class="fas fa-trash"></i> Remove
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

  window.adminDeleteUpload = async function(uploadId, videoFilename) {
    if (!confirm('Remove this user upload?')) return;

    if (videoFilename) {
      await window.supabase.storage.from(BUCKET_NAME).remove([videoFilename]);
    }

    const { error } = await window.supabase.from('user_videos').delete().eq('id', uploadId);
    if (error) { alert('Error: ' + error.message); return; }

    showToast('Upload removed.');
    loadUserUploads();
  };

  // ==========================================
  // ANALYTICS
  // ==========================================
  async function loadAnalytics() {
    const statTotal = document.getElementById('statTotal');
    const statBasic = document.getElementById('statBasic');
    const statIntermediate = document.getElementById('statIntermediate');
    const statAdvance = document.getElementById('statAdvance');
    const statUserUploads = document.getElementById('statUserUploads');
    const statUsers = document.getElementById('statUsers');
    const statRatings = document.getElementById('statRatings');
    const statComments = document.getElementById('statComments');

    // Total tutorials
    const { count: total } = await window.supabase.from('tutorials').select('id', { count: 'exact' });
    if (statTotal) statTotal.textContent = total || 0;

    // Per category
    const { count: basic } = await window.supabase.from('tutorials').select('id', { count: 'exact' }).eq('category', 'Basic');
    if (statBasic) statBasic.textContent = basic || 0;

    const { count: intermediate } = await window.supabase.from('tutorials').select('id', { count: 'exact' }).eq('category', 'Intermediate');
    if (statIntermediate) statIntermediate.textContent = intermediate || 0;

    const { count: advance } = await window.supabase.from('tutorials').select('id', { count: 'exact' }).eq('category', 'Advance');
    if (statAdvance) statAdvance.textContent = advance || 0;

    // User uploads
    const { count: userUploadsCount } = await window.supabase.from('user_videos').select('id', { count: 'exact' });
    if (statUserUploads) statUserUploads.textContent = userUploadsCount || 0;

    // Total ratings
    const { count: ratingsCount } = await window.supabase.from('ratings').select('id', { count: 'exact' });
    if (statRatings) statRatings.textContent = ratingsCount || 0;

    // Total comments
    const { count: commentsCount } = await window.supabase.from('comments').select('id', { count: 'exact' });
    if (statComments) statComments.textContent = commentsCount || 0;
  }

  // ==========================================
  // TOAST
  // ==========================================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px;
      z-index: 9999; border: 1px solid rgba(255,255,255,0.1); font-family: 'Inter', sans-serif;
      font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      animation: fadeInOut 3s forwards;
    `;
    const style = document.createElement('style');
    style.textContent = `@keyframes fadeInOut {
      0%{opacity:0;bottom:20px} 15%{opacity:1;bottom:30px}
      85%{opacity:1;bottom:30px} 100%{opacity:0;bottom:20px}
    }`;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); style.remove(); }, 3000);
  }

});