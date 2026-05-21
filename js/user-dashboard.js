document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Check
  if (!window.supabase) {
    console.error("Supabase not loaded");
    return;
  }

  const { data: sessionData } = await window.supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    window.location.href = 'index.html'; // Redirect to home if not logged in
    return;
  }

  // 2. Setup Sidebar UI
  const isGuest = user.email === null;
  const dashName = document.getElementById('dashName');
  const dashEmail = document.getElementById('dashEmail');
  const dashAvatar = document.getElementById('dashAvatar');

  dashName.textContent = isGuest ? 'Guest User' : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
  dashEmail.textContent = isGuest ? '' : user.email;

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  dashAvatar.innerHTML = avatarUrl
    ? `<img src="${avatarUrl}" alt="avatar">`
    : `<i class="fas fa-${isGuest ? 'user-ghost' : 'user'}"></i>`;

  // Sidebar Navigation Logic
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  const sections = document.querySelectorAll('.dashboard-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update active nav
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update active section
      const targetId = item.dataset.target;
      sections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');

      // Load data for section if not already loaded
      if (targetId === 'likedVideos') loadLikedVideos(user.id);
      if (targetId === 'savedVideos') loadSavedVideos(user.id);
      if (targetId === 'myUploads') loadMyUploads(user.id);

      // Close mobile sidebar
      document.querySelector('.dashboard-sidebar').classList.remove('active');
    });
  });

  // Mobile Sidebar Toggles
  document.getElementById('sidebarOpenBtn')?.addEventListener('click', () => {
    document.querySelector('.dashboard-sidebar').classList.add('active');
  });
  document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => {
    document.querySelector('.dashboard-sidebar').classList.remove('active');
  });

  // Sign out
  document.getElementById('dashSignOutBtn')?.addEventListener('click', async () => {
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
  });

  // 3. Data Fetching Functions

  async function loadLikedVideos(userId) {
    const grid = document.getElementById('likedGrid');
    const { data: likes } = await window.supabase.from('ratings').select('tutorial_id').eq('session_id', userId);

    if (!likes || likes.length === 0) {
      grid.innerHTML = '<p class="empty-state">No liked videos yet.</p>';
      return;
    }

    const tutorialIds = likes.map(l => l.tutorial_id);
    const { data: videos } = await window.supabase.from('tutorials').select('*').in('id', tutorialIds);
    renderVideoGrid(grid, videos, false);
  }

  async function loadSavedVideos(userId) {
    const grid = document.getElementById('savedGrid');
    const { data: saves } = await window.supabase.from('progress').select('tutorial_id').eq('session_id', userId);

    if (!saves || saves.length === 0) {
      grid.innerHTML = '<p class="empty-state">No saved videos yet.</p>';
      return;
    }

    const tutorialIds = saves.map(s => s.tutorial_id);
    const { data: videos } = await window.supabase.from('tutorials').select('*').in('id', tutorialIds);
    renderVideoGrid(grid, videos, false);
  }

  async function loadMyUploads(userId) {
    const grid = document.getElementById('uploadsGrid');
    // Using the new user_uploads table
    const { data: uploads, error } = await window.supabase
      .from('user_uploads')
      .select('*, tutorials(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<p class="empty-state">Please create the user_uploads table in Supabase first.</p>`;
      return;
    }

    if (!uploads || uploads.length === 0) {
      grid.innerHTML = '<p class="empty-state">You haven\'t uploaded any proof of learning yet.</p>';
      return;
    }

    grid.innerHTML = '';
    uploads.forEach(upload => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const tutTitle = upload.tutorials ? upload.tutorials.title : 'Unknown Tutorial';

      card.innerHTML = `
        <div class="video-card-thumbnail">
          <video src="${upload.video_url}" muted playsinline></video>
        </div>
        <div class="video-card-info">
          <h3 class="video-card-title">Proof for: ${tutTitle}</h3>
          <div class="video-card-meta">
            <span>${new Date(upload.created_at).toLocaleDateString()}</span>
          </div>
          <div class="video-card-actions">
            <button class="card-btn danger" data-id="${upload.id}" onclick="deleteUpload('${upload.id}', '${upload.video_url}')">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function renderVideoGrid(gridElement, videos, isDeletable = false) {
    if (!videos || videos.length === 0) {
      gridElement.innerHTML = '<p class="empty-state">No videos found.</p>';
      return;
    }

    gridElement.innerHTML = '';
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="video-card-thumbnail">
          <video src="${video.video_url}" muted playsinline></video>
        </div>
        <div class="video-card-info">
          <h3 class="video-card-title">${video.title}</h3>
          <div class="video-card-meta">
            <span>${video.category || 'Basic'}</span>
          </div>
          <div class="video-card-actions">
            <a href="video-hacks.html" class="card-btn" style="text-align:center; text-decoration:none; display:inline-block; width:100%; box-sizing:border-box;">Watch Again</a>
          </div>
        </div>
      `;

      // Auto play on hover
      const videoEl = card.querySelector('video');
      card.addEventListener('mouseenter', () => videoEl.play().catch(e=>e));
      card.addEventListener('mouseleave', () => {
        videoEl.pause();
        videoEl.currentTime = 0;
      });

      gridElement.appendChild(card);
    });
  }

  // 4. Upload Proof Logic
  const uploadProofModal = document.getElementById('uploadProofModal');
  const openUploadProofBtn = document.getElementById('openUploadProofBtn');
  const closeUploadProofBtn = document.getElementById('closeUploadProofBtn');
  const proofTutorialSelect = document.getElementById('proofTutorialSelect');

  openUploadProofBtn?.addEventListener('click', async () => {
    // Populate select
    const { data: tutorials } = await window.supabase.from('tutorials').select('id, title').order('created_at', { ascending: false });
    if (tutorials) {
      proofTutorialSelect.innerHTML = '<option value="">Select a tutorial...</option>' +
        tutorials.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    }

    uploadProofModal.classList.add('active');
    uploadProofModal.setAttribute('aria-hidden', 'false');
  });

  closeUploadProofBtn?.addEventListener('click', () => {
    uploadProofModal.classList.remove('active');
    uploadProofModal.setAttribute('aria-hidden', 'true');
    document.getElementById('proofError').textContent = '';
    document.getElementById('proofProgress').style.display = 'none';
  });

  document.getElementById('submitProofBtn')?.addEventListener('click', async () => {
    const tutId = proofTutorialSelect.value;
    const file = document.getElementById('proofFile').files[0];
    const errorEl = document.getElementById('proofError');

    if (!tutId || !file) {
      errorEl.textContent = 'Please select a tutorial and a video file.';
      return;
    }

    document.getElementById('proofProgress').style.display = 'block';
    document.getElementById('proofStatus').textContent = 'Uploading...';

    // Upload to storage
    const fileName = `${user.id}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error: storageError } = await window.supabase.storage
      .from('caphacksVideos') // reusing existing bucket for simplicity, ideal is separate 'userVideos'
      .upload(fileName, file);

    if (storageError) {
      errorEl.textContent = 'Upload failed: ' + storageError.message;
      document.getElementById('proofProgress').style.display = 'none';
      return;
    }

    document.getElementById('proofBar').value = 80;

    const { data: urlData } = window.supabase.storage
      .from('caphacksVideos')
      .getPublicUrl(fileName);

    // Insert to DB
    const { error: dbError } = await window.supabase.from('user_uploads').insert({
      user_id: user.id,
      tutorial_id: tutId,
      video_url: urlData.publicUrl,
      video_filename: fileName
    });

    if (dbError) {
      errorEl.textContent = 'Database error. Make sure the table is created.';
      return;
    }

    document.getElementById('proofBar').value = 100;
    document.getElementById('proofStatus').textContent = 'Success!';

    setTimeout(() => {
      closeUploadProofBtn.click();
      loadMyUploads(user.id);
    }, 1000);
  });

  // Global delete function for uploads
  window.deleteUpload = async function(uploadId, videoUrl) {
    if(!confirm("Are you sure you want to delete this video?")) return;

    if (videoUrl) {
        const filePathMatch = videoUrl.match(/caphacksVideos\/(.+)$/);
        if (filePathMatch && filePathMatch[1]) {
            const { error: storageError } = await window.supabase.storage.from('caphacksVideos').remove([filePathMatch[1]]);
            if (storageError) {
                console.error("Failed to delete file from storage:", storageError.message);
            }
        }
    }

    const { error } = await window.supabase.from('user_uploads').delete().eq('id', uploadId);
    if(error) {
      alert("Failed to delete: " + error.message);
    } else {
      loadMyUploads(user.id);
    }
  };

  // Initial Load
  loadLikedVideos(user.id);
});
