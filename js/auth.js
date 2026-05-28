if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('authModal');
  const loginOpenBtn = document.getElementById('loginOpenBtn');
  const loginOpenMobileBtn = document.getElementById('loginOpenMobileBtn');
  const signupOpenBtn = document.getElementById('signupOpenBtn');
  const signupOpenMobileBtn = document.getElementById('signupOpenMobileBtn');
  const authCloseBtn = document.getElementById('authCloseBtn');
  const switchModeBtn = document.getElementById('switchModeBtn');
  const authForm = document.getElementById('authForm');
  const authError = document.getElementById('authError');
  const submitAuthBtn = document.getElementById('submitAuthBtn');
  const confirmPasswordRow = document.getElementById('confirmPasswordRow');
  const googleAuthBtn = document.getElementById('googleAuthBtn');
  const authTitle = document.getElementById('authTitle');
  const authButtonsGroup = document.getElementById('authButtons');
  const userBadge = document.getElementById('userBadge');
  const profileBtn = document.getElementById('profileBtn');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileName = document.getElementById('profileName');
  const profileDropdown = document.getElementById('profileDropdown');
  const dropdownSignOutBtn = document.getElementById('dropdownSignOutBtn');
  const mobileUserBadge = document.getElementById('mobileUserBadge');
  const mobileProfileAvatar = document.getElementById('mobileProfileAvatar');
  const mobileProfileName = document.getElementById('mobileProfileName');
  const mobileProfileDropdown = document.getElementById('mobileProfileDropdown');
  const mobileDropdownSignOutBtn = document.getElementById('mobileDropdownSignOutBtn');

  function getAvatarHtml(user, isGuest) {
    if (isGuest) {
      return '<i class="fa-solid fa-user-ghost"></i>';
    }

    const metadata = user.user_metadata || user.raw_user_meta_data || {};
    const avatarUrl = metadata.avatar_url || metadata.picture;
    if (avatarUrl) {
      return `<img src="${avatarUrl}" alt="${getDisplayName(user, false)} avatar" />`;
    }
    return '<i class="fa-solid fa-user"></i>';
  }

  function showUserHeader(user, isGuest = false) {
    if (authButtonsGroup) authButtonsGroup.hidden = true;
    if (userBadge) userBadge.hidden = false;
    if (mobileUserBadge) mobileUserBadge.hidden = false;
    if (profileAvatar) profileAvatar.innerHTML = getAvatarHtml(user, isGuest);
    if (mobileProfileAvatar) mobileProfileAvatar.innerHTML = getAvatarHtml(user, isGuest);
    if (profileName) profileName.textContent = isGuest ? '' : getDisplayName(user, isGuest);
    if (mobileProfileName) mobileProfileName.textContent = isGuest ? '' : getDisplayName(user, isGuest);

    const myDashboardBtn = document.getElementById('myDashboardBtn');
    if (myDashboardBtn) {
      myDashboardBtn.style.display = 'inline-block';
      if (isGuest || user.email === null) {
        myDashboardBtn.addEventListener('click', (e) => {
          e.preventDefault();
          alert('You need to log in or create an account to use the dashboard.');
        });
      } else {
        const isAdmin = window.isAdminUser ? window.isAdminUser(user) : false;
        myDashboardBtn.href = isAdmin ? 'admin-dashboard.html' : 'user-dashboard.html';
      }
    }
  }

  function hideUserHeader() {
    if (authButtonsGroup) authButtonsGroup.hidden = false;
    if (userBadge) userBadge.hidden = true;
    if (mobileUserBadge) mobileUserBadge.hidden = true;
    if (profileAvatar) profileAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
    if (mobileProfileAvatar) mobileProfileAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
    if (profileName) profileName.textContent = 'Guest';
    if (mobileProfileName) mobileProfileName.textContent = 'Guest';
    if (profileDropdown) profileDropdown.hidden = true;
    if (mobileProfileDropdown) mobileProfileDropdown.hidden = true;
  }

  function toggleDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.hidden = !dropdown.hidden;
  }

  function closeDropdowns() {
    if (profileDropdown) profileDropdown.hidden = true;
    if (mobileProfileDropdown) mobileProfileDropdown.hidden = true;
  }

  async function refreshAuthHeader() {
    if (!window.supabase || !window.supabase.auth) return;
    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;
    if (user) {
      const isGuest = user.email === null;
      showUserHeader(user, isGuest);
    } else {
      hideUserHeader();
    }
  }

  function handleSignOut() {
    return async () => {
      if (!window.supabase || !window.supabase.auth) return;
      await window.supabase.auth.signOut();
      hideUserHeader();
      window.location.reload();
    };
  }

  function setAuthMode(mode) {
    if (!authForm || !submitAuthBtn || !confirmPasswordRow || !authTitle || !switchModeBtn) return;
    authForm.dataset.mode = mode;

    if (mode === 'signup') {
      authTitle.textContent = 'Create your CapHacks account';
      submitAuthBtn.textContent = 'Sign Up';
      confirmPasswordRow.style.display = 'block';
      switchModeBtn.textContent = 'Log In';
      switchModeBtn.dataset.targetMode = 'login';
    } else {
      authTitle.textContent = 'Sign In to CapHacks';
      submitAuthBtn.textContent = 'Sign In';
      confirmPasswordRow.style.display = 'none';
      switchModeBtn.textContent = 'Sign Up';
      switchModeBtn.dataset.targetMode = 'signup';
    }
  }

  function openAuthModal(mode = 'login') {
    if (!authModal) return;
    setAuthMode(mode);
    authModal.classList.add('active');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (authError) authError.textContent = '';
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('active');
    authModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function getAuthMode() {
    return authForm?.dataset.mode || 'login';
  }

  loginOpenBtn?.addEventListener('click', () => openAuthModal('login'));
  loginOpenMobileBtn?.addEventListener('click', () => openAuthModal('login'));
  signupOpenBtn?.addEventListener('click', () => openAuthModal('signup'));
  signupOpenMobileBtn?.addEventListener('click', () => openAuthModal('signup'));
  authCloseBtn?.addEventListener('click', closeAuthModal);
  switchModeBtn?.addEventListener('click', () => openAuthModal(switchModeBtn.dataset.targetMode || 'login'));

  authModal?.addEventListener('click', (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  profileBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown(profileDropdown);
    if (mobileProfileDropdown) mobileProfileDropdown.hidden = true;
  });

  mobileUserBadge?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown(mobileProfileDropdown);
    if (profileDropdown) profileDropdown.hidden = true;
  });

  profileDropdown?.addEventListener('click', (event) => event.stopPropagation());
  mobileProfileDropdown?.addEventListener('click', (event) => event.stopPropagation());

  document.addEventListener('click', closeDropdowns);

  dropdownSignOutBtn?.addEventListener('click', handleSignOut());
  mobileDropdownSignOutBtn?.addEventListener('click', handleSignOut());

  googleAuthBtn?.addEventListener('click', async () => {
    console.log('Google login button clicked');
    if (!authError) return;
    authError.textContent = '';
    console.log('Checking Supabase availability:', !!window.supabase);
    if (!window.supabase || !window.supabase.auth) {
      authError.textContent = 'Unable to initialize auth service.';
      console.error('Supabase client not available');
      return;
    }

    console.log('Attempting Google OAuth...');
    const { error } = await window.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      console.error('Google OAuth error:', error);
      authError.textContent = error.message;
    } else {
      console.log('Google OAuth initiated successfully');
    }
  });

  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!authForm || !authError) return;

    const formData = new FormData(authForm);
    const email = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString();
    const mode = getAuthMode();

    if (!email || !password) {
      authError.textContent = 'Please enter both email and password.';
      return;
    }

    if (!window.supabase || !window.supabase.auth) {
      authError.textContent = 'Unable to initialize auth service.';
      return;
    }

    try {
      if (mode === 'signup') {
        const confirmPassword = formData.get('confirmPassword')?.toString();
        if (!confirmPassword) {
          authError.textContent = 'Please confirm your password.';
          return;
        }
        if (password !== confirmPassword) {
          authError.textContent = 'Passwords do not match.';
          return;
        }

        authError.textContent = 'Signing up...';
        const { data, error } = await window.supabase.auth.signUp({ email, password });
        if (error) {
          authError.textContent = error.message;
          return;
        }

        if (data?.user) {
          closeAuthModal();
          const guestId = localStorage.getItem('caphacks_guest_session');
          await migrateGuestData(data.user.id, guestId);
          await refreshAuthHeader();
          window.location.href = 'video-hacks.html';
          return;
        }

        authError.textContent = 'Check your email for confirmation before signing in.';
        return;
      }

      authError.textContent = 'Signing in...';
      const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        authError.textContent = error.message;
        return;
      }

      if (data?.user) {
        closeAuthModal();
        const guestId = localStorage.getItem('caphacks_guest_session');
        await migrateGuestData(data.user.id, guestId);
        await refreshAuthHeader();
        window.location.href = 'video-hacks.html';
      } else {
        authError.textContent = 'Sign in failed. Please try again.';
      }
    } catch (err) {
      console.error('Auth error:', err);
      authError.textContent = err.message || 'An unexpected error occurred.';
    }
  });

  window.supabase.auth.onAuthStateChange(async (_event, session) => {
  const user = session?.user;

  if (_event === 'SIGNED_OUT') {
    hideUserHeader();
    return;
  }

  if (user && user.email !== null) {
    // Upsert profile so their name shows in comments and other places
    try {
        const metadata = user.user_metadata || user.raw_user_meta_data || {};
        const full_name = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User';
        const avatar_url = metadata.avatar_url || metadata.picture || null;
        await window.supabase.from('profiles').upsert({
            id: user.id,
            full_name: full_name,
            avatar_url: avatar_url
        });
    } catch (e) {
        console.error("Failed to upsert profile:", e);
    }

    const guestId = localStorage.getItem('caphacks_guest_session');
    if (guestId && guestId.startsWith('guest_')) {
      await migrateGuestData(user.id, guestId);
    }
    window.guestSessionId = user.id;
    showUserHeader(user, false);
  } else if (user) {
    showUserHeader(user, true);
  }
});

async function migrateGuestData(userId, guestId) {
  // Kung walang guestId o hindi guest format, wag mag-migrate
  if (!guestId || !guestId.startsWith('guest_')) return;

  console.log('Migrating guest data from:', guestId, 'to:', userId);

  await window.supabase
    .from('ratings')
    .update({ session_id: userId })
    .eq('session_id', guestId);

  await window.supabase
    .from('progress')
    .update({ session_id: userId })
    .eq('session_id', guestId);

  // Clear yung guest session — hindi na kailangan
  localStorage.removeItem('caphacks_guest_session');
  window.guestSessionId = userId;

  console.log('Migration done!');
}

// ==========================================
// MY VIDEOS MODAL
// ==========================================
const myVideosModal = document.getElementById('myVideosModal');
const myVideosCloseBtn = document.getElementById('myVideosCloseBtn');
const myVideosBtn = document.getElementById('myVideosBtn');
const myVideosMobileBtn = document.getElementById('myVideosMobileBtn');

async function openMyVideosModal() {
  if (!myVideosModal || !window.supabase) return;
  closeDropdowns();

  const { data } = await window.supabase.auth.getSession();
  const user = data?.session?.user;

  // Set avatar + name
  const avatarEl = document.getElementById('myVideosAvatar');
  const nameEl = document.getElementById('myVideosName');

  if (user && user.email !== null) {
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    avatarEl.innerHTML = avatarUrl
      ? `<img src="${avatarUrl}" alt="avatar">`
      : `<i class="fa-solid fa-user"></i>`;
    nameEl.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  } else {
    avatarEl.innerHTML = `<i class="fa-solid fa-user-ghost"></i>`;
    nameEl.textContent = 'Guest';
  }

  // Fetch saved videos
  const sessionId = window.guestSessionId;
  const grid = document.getElementById('myVideosGrid');
  grid.innerHTML = '<p class="my-videos-empty">Loading...</p>';

  const { data: saved, error } = await window.supabase
    .from('progress')
    .select('tutorial_id')
    .eq('session_id', sessionId);

  if (error || !saved || saved.length === 0) {
    grid.innerHTML = '<p class="my-videos-empty">No saved videos yet.</p>';
    myVideosModal.classList.add('active');
    myVideosModal.setAttribute('aria-hidden', 'false');
    return;
  }

  // Get tutorial IDs
  const tutorialIds = saved.map(s => s.tutorial_id);

  const { data: videos } = await window.supabase
    .from('tutorials')
    .select('id, title, video_url')
    .in('id', tutorialIds);

  if (!videos || videos.length === 0) {
    grid.innerHTML = '<p class="my-videos-empty">No saved videos yet.</p>';
  } else {
    grid.innerHTML = '';
    videos.forEach((video) => {
      const card = document.createElement('div');
      card.classList.add('my-video-card');
      card.innerHTML = `
        <video src="${video.video_url}" muted playsinline preload="metadata"></video>
        <div class="my-video-card-title">${video.title}</div>
      `;

      // Hover preview
      card.addEventListener('mouseenter', () => card.querySelector('video').play());
      card.addEventListener('mouseleave', () => {
        const v = card.querySelector('video');
        v.pause();
        v.currentTime = 0;
      });

      // Click — open saved feed
      card.addEventListener('click', () => {
        openSavedFeed(videos, video.id);
      });

      grid.appendChild(card);
    });
  }

  myVideosModal.classList.add('active');
  myVideosModal.setAttribute('aria-hidden', 'false');
}

myVideosCloseBtn?.addEventListener('click', () => {
  myVideosModal.classList.remove('active');
  myVideosModal.setAttribute('aria-hidden', 'true');
});

function openSavedFeed(videos, startId) {
  // Close My Videos modal
  myVideosModal.classList.remove('active');
  myVideosModal.setAttribute('aria-hidden', 'true');

  // Store saved videos sa window para ma-access ng video-hacks.js
  window.savedFeedVideos = videos;
  window.savedFeedStartId = startId;

  // Trigger render ng saved feed
  if (typeof renderSavedFeed === 'function') {
    renderSavedFeed(videos, startId);
  }
}

async function handleMyVideosClick(e) {
  e.preventDefault();
  closeDropdowns();

  const { data } = await window.supabase.auth.getSession();
  const user = data?.session?.user;

  if (!user) {
    showAuthToast();
    return;
  }

  openMyVideosModal();
}

myVideosBtn?.addEventListener('click', handleMyVideosClick);
myVideosMobileBtn?.addEventListener('click', handleMyVideosClick);

  refreshAuthHeader();

  // ==========================================
// PROFILE MODAL
// ==========================================
const profileModal = document.getElementById('profileModal');
const profileCloseBtn = document.getElementById('profileCloseBtn');
const myProfileBtn = document.getElementById('myProfileBtn');
const myProfileMobileBtn = document.getElementById('myProfileMobileBtn');

async function openProfileModal() {
  if (!profileModal || !window.supabase) return;
  closeDropdowns();

  const { data } = await window.supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return;

  const isGuest = user.email === null;
  const isGoogle = user.app_metadata?.provider === 'google';
  const isEmail = !isGuest && !isGoogle;

  // Avatar
  const avatarEl = document.getElementById('profileModalAvatar');
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  avatarEl.innerHTML = avatarUrl
    ? `<img src="${avatarUrl}" alt="avatar">`
    : `<i class="fa-solid fa-${isGuest ? 'user-ghost' : 'user'}"></i>`;

  // Name + Email
  document.getElementById('profileModalName').textContent = isGuest
    ? 'Guest User'
    : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
  document.getElementById('profileModalEmail').textContent = isGuest ? '' : user.email;

  // Badge
  const badge = document.getElementById('profileModalBadge');
  badge.textContent = isGuest ? 'Guest' : isGoogle ? 'Google' : 'Email';
  badge.className = `profile-modal-badge ${isGuest ? 'guest' : isGoogle ? 'google' : 'email'}`;

  // Joined date
  const joined = new Date(user.created_at);
  document.getElementById('statJoined').textContent = joined.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Stats — saved + liked counts
  const sessionId = window.guestSessionId || user.id;

  const { count: savedCount } = await window.supabase
    .from('progress')
    .select('id', { count: 'exact' })
    .eq('session_id', sessionId);

  const { count: likedCount } = await window.supabase
    .from('ratings')
    .select('id', { count: 'exact' })
    .eq('session_id', sessionId);

  document.getElementById('statSaved').textContent = savedCount || 0;
  document.getElementById('statLiked').textContent = likedCount || 0;

  // Reset password button — email users lang
  const actionsEl = document.getElementById('profileModalActions');
  actionsEl.innerHTML = isEmail
    ? `<button class="profile-reset-btn" id="resetPasswordBtn"><i class="fas fa-key"></i> Reset Password</button>`
    : '';

  if (isEmail) {
    document.getElementById('resetPasswordBtn')?.addEventListener('click', async () => {
      const { error } = await window.supabase.auth.resetPasswordForEmail(user.email);
      if (!error) alert('Password reset email sent!');
    });
  }

  // Delete account
  const deleteBtn = document.getElementById('profileDeleteBtn');
  if (deleteBtn) {
    if (isGuest) {
      deleteBtn.style.display = 'none'; // Guests can't delete accounts
    } else {
      deleteBtn.style.display = 'block';
      deleteBtn.onclick = async () => {
        const confirm = window.confirm('Are you sure? This cannot be undone.');
        if (!confirm) return;
        // Use RPC or edge function for non-admin user deletion if needed, but for now we sign out as a fallback
        if (window.supabase.auth.admin) {
           await window.supabase.auth.admin.deleteUser(user.id);
        }
        await window.supabase.auth.signOut();
        window.location.reload();
      };
    }
  }

  profileModal.classList.add('active');
  profileModal.setAttribute('aria-hidden', 'false');
}

profileCloseBtn?.addEventListener('click', () => {
  profileModal.classList.remove('active');
  profileModal.setAttribute('aria-hidden', 'true');
});

async function handleProfileClick(e) {
  e.preventDefault();
  closeDropdowns();

  const { data } = await window.supabase.auth.getSession();
  const user = data?.session?.user;

  if (!user) {
    showAuthToast();
    return;
  }

  openProfileModal();
}

function showAuthToast() {
  const existing = document.getElementById('authToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'authToast';
  toast.innerHTML = `<i class="fas fa-lock"></i> <span>Create an account to access your profile!</span>`;
  toast.style.cssText = `
    position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
    background: #1a1a1a; color: white; padding: 14px 24px; border-radius: 10px;
    z-index: 9999; border: 1px solid rgba(255,255,255,0.1);
    font-family: 'Inter', sans-serif; font-size: 14px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    display: flex; align-items: center; gap: 10px;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

myProfileBtn?.addEventListener('click', handleProfileClick);
myProfileMobileBtn?.addEventListener('click', handleProfileClick);
});
}

function getDisplayName(user, isGuest) {
  if (isGuest) return '';
  // Try taking the name from raw_user_meta_data if user_metadata is missing
  const metadata = user.user_metadata || user.raw_user_meta_data || {};
  return metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDisplayName
  };
}

