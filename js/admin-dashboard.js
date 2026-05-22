document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth & Admin Check
  if (!window.supabase) {
    console.error("Supabase not loaded");
    return;
  }

  const { data: sessionData } = await window.supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user || !window.isAdminUser || !window.isAdminUser(user)) {
    alert('Access Denied. Admins only.');
    window.location.href = 'index.html';
    return;
  }

  // 2. Setup Sidebar UI
  document.getElementById('dashEmail').textContent = user.email;
  const dashName = document.getElementById('dashName');
  if (dashName) {
    dashName.textContent = user.user_metadata?.full_name || 'Admin';
  }
  const dashAvatar = document.getElementById('dashAvatar');
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  if (avatarUrl && dashAvatar) {
    dashAvatar.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
  }


  // Sidebar Navigation Logic
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  const sections = document.querySelectorAll('.dashboard-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      const targetId = item.dataset.target;
      sections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'manageTutorials') loadManageTutorials();
      if (targetId === 'manageUserUploads') loadManageUserUploads();
      if (targetId === 'analytics') loadAnalytics();

      document.querySelector('.dashboard-sidebar').classList.remove('active');
    });
  });

  document.getElementById('sidebarOpenBtn')?.addEventListener('click', () => {
    document.querySelector('.dashboard-sidebar').classList.add('active');
  });
  document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => {
    document.querySelector('.dashboard-sidebar').classList.remove('active');
  });

  document.getElementById('dashSignOutBtn')?.addEventListener('click', async () => {
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
  });


  // 3. Upload Tutorial Logic
  document.getElementById('uploadSubmitBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('uploadTitle').value.trim();
    const description = document.getElementById('uploadDescription').value.trim();
    const category = document.getElementById('uploadCategory').value;
    const file = document.getElementById('uploadFile').files[0];
    const tags = document.getElementById('uploadTags').value.trim();
    const errorEl = document.getElementById('uploadError');

    if (!title || !file) {
      errorEl.textContent = 'Title and video file are required.';
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
      // Reset form
      document.getElementById('uploadTitle').value = '';
      document.getElementById('uploadDescription').value = '';
      document.getElementById('uploadTags').value = '';
      document.getElementById('uploadFile').value = '';
      document.getElementById('uploadProgress').style.display = 'none';
      document.getElementById('uploadBar').value = 0;
      errorEl.textContent = 'Upload successful!';
      errorEl.style.color = '#3ecfea';

      // refresh lists if needed
      loadAnalytics();
    }, 1500);
  });


  // 4. Manage Tutorials
  async function loadManageTutorials() {
    const grid = document.getElementById('manageGrid');
    const { data: videos, error } = await window.supabase.from('tutorials').select('*').order('created_at', { ascending: false });

    if (error || !videos || videos.length === 0) {
      grid.innerHTML = '<p class="empty-state">No tutorials found.</p>';
      return;
    }

    grid.innerHTML = '';
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
            <button class="card-btn danger" onclick="deleteTutorial('${video.id}', '${video.video_filename}')">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  window.deleteTutorial = async function(id, filename) {
    if (!confirm("Are you sure you want to permanently delete this tutorial?")) return;

    // Delete from DB
    const { error: dbError } = await window.supabase.from('tutorials').delete().eq('id', id);
    if (dbError) {
      alert("Failed to delete from database: " + dbError.message);
      return;
    }

    // Delete from Storage
    if (filename) {
        await window.supabase.storage.from('caphacksVideos').remove([filename]);
    }

    loadManageTutorials();
    loadAnalytics();
  };

  // 5. Manage User Uploads
  async function loadManageUserUploads() {
    const grid = document.getElementById('userUploadsGrid');
    const { data: uploads, error } = await window.supabase
      .from('user_uploads')
      .select('*, auth.users!user_id(email)')
      .order('created_at', { ascending: false });

    if (error || !uploads || uploads.length === 0) {
      grid.innerHTML = '<p class="empty-state">No user uploads found.</p>';
      return;
    }

    grid.innerHTML = '';
    uploads.forEach(upload => {
      const card = document.createElement('div');
      card.className = 'video-card';

      card.innerHTML = `
        <div class="video-card-thumbnail">
          <video src="${upload.video_url}" controls playsinline></video>
        </div>
        <div class="video-card-info">
          <h3 class="video-card-title">User ID: ${upload.user_id.substring(0,8)}...</h3>
          <div class="video-card-meta">
            <span>${new Date(upload.created_at).toLocaleDateString()}</span>
          </div>
          <div class="video-card-actions">
            <button class="card-btn danger" onclick="deleteUserUpload('${upload.id}', '${upload.video_filename}')">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  window.deleteUserUpload = async function(id, filename) {
    if (!confirm("Are you sure you want to permanently delete this user's video?")) return;

    const { error: dbError } = await window.supabase.from('user_uploads').delete().eq('id', id);
    if (dbError) {
      alert("Failed to delete from database.");
      return;
    }
    if (filename) {
        await window.supabase.storage.from('caphacksVideos').remove([filename]);
    }
    loadManageUserUploads();
    loadAnalytics();
  }


  // 6. Analytics
  async function loadAnalytics() {
    // Tutorials
    const { data: tuts } = await window.supabase.from('tutorials').select('category');
    if (tuts) {
        document.getElementById('statTotal').textContent = tuts.length;
        document.getElementById('statBasic').textContent = tuts.filter(t => t.category === 'Basic').length;
        document.getElementById('statIntermediate').textContent = tuts.filter(t => t.category === 'Intermediate').length;
        document.getElementById('statAdvance').textContent = tuts.filter(t => t.category === 'Advance').length;
    }

    // User Uploads
    const { count, error } = await window.supabase.from('user_uploads').select('id', { count: 'exact' });
    if (!error) {
        document.getElementById('statUserUploads').textContent = count || 0;
    }
  }

  // Initial load
  loadAnalytics();

});
