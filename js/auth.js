function getDisplayName(user, isGuest) {
  if (isGuest || !user) return '';
  if (user.user_metadata && user.user_metadata.full_name) {
    return user.user_metadata.full_name;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'User';
}

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
    const guestAuthBtn = document.getElementById('guestAuthBtn');
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
      if (isGuest || !user) {
        return '<i class="fa-solid fa-user"></i>';
      }

      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (avatarUrl) {
        return `<img src="${avatarUrl}" alt="${getDisplayName(user, false)} avatar" />`;
      }
      return '<i class="fa-solid fa-user"></i>';
    }

    function showUserHeader(user, isGuest = false) {
      if (authButtonsGroup) authButtonsGroup.style.display = 'none';
      if (userBadge) { userBadge.hidden = false; userBadge.style.display = 'flex'; }
      if (mobileUserBadge) { mobileUserBadge.hidden = false; mobileUserBadge.style.display = 'flex'; }
      if (profileAvatar) profileAvatar.innerHTML = getAvatarHtml(user, isGuest);
      if (mobileProfileAvatar) mobileProfileAvatar.innerHTML = getAvatarHtml(user, isGuest);
      if (profileName) profileName.textContent = isGuest ? 'Guest' : getDisplayName(user, isGuest);
      if (mobileProfileName) mobileProfileName.textContent = isGuest ? 'Guest' : getDisplayName(user, isGuest);

      const myDashboardBtn = document.getElementById('myDashboardBtn');
      if (myDashboardBtn) {
        myDashboardBtn.style.display = 'inline-flex';
        if (isGuest || !user || user.email === null) {
          myDashboardBtn.onclick = (e) => {
            e.preventDefault();
            showAuthToast('Create an account to access the dashboard!');
          };
        } else {
          myDashboardBtn.onclick = null;
          const isAdmin = window.isAdminUser ? window.isAdminUser(user) : false;
          myDashboardBtn.href = isAdmin ? 'admin-dashboard.html' : 'user-dashboard.html';
        }
      }
    }

    function hideUserHeader() {
      if (authButtonsGroup) { authButtonsGroup.style.display = 'flex'; authButtonsGroup.hidden = false; }
      if (userBadge) { userBadge.hidden = true; userBadge.style.display = 'none'; }
      if (mobileUserBadge) { mobileUserBadge.hidden = true; mobileUserBadge.style.display = 'none'; }
      if (profileAvatar) profileAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
      if (mobileProfileAvatar) mobileProfileAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
      if (profileName) profileName.textContent = 'Guest';
      if (mobileProfileName) mobileProfileName.textContent = 'Guest';
      if (profileDropdown) profileDropdown.hidden = true;
      if (mobileProfileDropdown) mobileProfileDropdown.hidden = true;

      const myDashboardBtn = document.getElementById('myDashboardBtn');
      if (myDashboardBtn) {
        myDashboardBtn.style.display = 'none';
      }
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
      if (!window.supabase || !window.supabase.auth) {
        setTimeout(refreshAuthHeader, 100);
        return;
      }
      try {
        const { data } = await window.supabase.auth.getSession();
        const user = data?.session?.user;
        if (user && user.email !== null) {
          showUserHeader(user, false);
        } else {
          hideUserHeader();
        }
      } catch (e) {
        console.warn('Auth check error:', e);
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

    // Guest Auth Handler
    guestAuthBtn?.addEventListener('click', async () => {
      closeAuthModal();
      if (!window.guestSessionId) {
        window.guestSessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('caphacks_guest_session', window.guestSessionId);
      }
      showAuthToast('Continuing as Guest. Welcome to CapHacks!');
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        setTimeout(() => {
          window.location.href = 'video-hacks.html';
        }, 500);
      }
    });

    // Google OAuth Handler
    googleAuthBtn?.addEventListener('click', async () => {
      if (!authError) return;
      authError.textContent = '';
      if (!window.supabase || !window.supabase.auth) {
        authError.textContent = 'Unable to initialize auth service. Please try again.';
        return;
      }

      try {
        const { error } = await window.supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + window.location.pathname }
        });
        if (error) {
          authError.textContent = error.message;
        }
      } catch (err) {
        authError.textContent = err.message || 'Google sign-in error';
      }
    });

    // Form Submit (Email/Password)
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

          authError.textContent = 'Creating account...';
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
            showAuthToast('Account created successfully! Welcome!');
            if (!window.location.pathname.includes('video-hacks.html')) {
              window.location.href = 'video-hacks.html';
            }
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
          showAuthToast('Signed in successfully!');
          if (!window.location.pathname.includes('video-hacks.html')) {
            window.location.href = 'video-hacks.html';
          }
        } else {
          authError.textContent = 'Sign in failed. Please check your credentials.';
        }
      } catch (err) {
        console.error('Auth error:', err);
        authError.textContent = err.message || 'An unexpected error occurred.';
      }
    });

    // Listen for Auth State Changes
    function setupAuthListener() {
      if (!window.supabase || !window.supabase.auth) {
        setTimeout(setupAuthListener, 100);
        return;
      }

      window.supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user;

        if (_event === 'SIGNED_OUT' || !user) {
          hideUserHeader();
          return;
        }

        if (user && user.email !== null) {
          try {
            const full_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
            await window.supabase.from('profiles').upsert({
              id: user.id,
              full_name: full_name,
              avatar_url: avatar_url
            });
          } catch (e) {
            console.error('Failed to upsert profile:', e);
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
    }

    setupAuthListener();

    async function migrateGuestData(userId, guestId) {
      if (!guestId || !guestId.startsWith('guest_')) return;

      try {
        await window.supabase
          .from('ratings')
          .update({ session_id: userId })
          .eq('session_id', guestId);

        await window.supabase
          .from('progress')
          .update({ session_id: userId })
          .eq('session_id', guestId);

        localStorage.removeItem('caphacks_guest_session');
        window.guestSessionId = userId;
      } catch (e) {
        console.warn('Data migration notice:', e);
      }
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

      const avatarEl = document.getElementById('myVideosAvatar');
      const nameEl = document.getElementById('myVideosName');

      if (user && user.email !== null) {
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarEl) {
          avatarEl.innerHTML = avatarUrl
            ? `<img src="${avatarUrl}" alt="avatar">`
            : `<i class="fa-solid fa-user"></i>`;
        }
        if (nameEl) nameEl.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      } else {
        if (avatarEl) avatarEl.innerHTML = `<i class="fa-solid fa-user"></i>`;
        if (nameEl) nameEl.textContent = 'Guest';
      }

      const sessionId = window.guestSessionId;
      const grid = document.getElementById('myVideosGrid');
      if (grid) grid.innerHTML = '<p class="my-videos-empty">Loading saved tutorials...</p>';

      const { data: saved, error } = await window.supabase
        .from('progress')
        .select('tutorial_id')
        .eq('session_id', sessionId);

      if (error || !saved || saved.length === 0) {
        if (grid) grid.innerHTML = '<p class="my-videos-empty">No saved videos yet. Bookmark your favorite hacks to see them here!</p>';
        myVideosModal.classList.add('active');
        myVideosModal.setAttribute('aria-hidden', 'false');
        return;
      }

      const tutorialIds = saved.map(s => s.tutorial_id).filter(Boolean);

      if (tutorialIds.length === 0) {
        if (grid) grid.innerHTML = '<p class="my-videos-empty">No saved videos yet.</p>';
        myVideosModal.classList.add('active');
        myVideosModal.setAttribute('aria-hidden', 'false');
        return;
      }

      const { data: videos } = await window.supabase
        .from('tutorials')
        .select('id, title, video_url, category')
        .in('id', tutorialIds);

      if (!videos || videos.length === 0) {
        if (grid) grid.innerHTML = '<p class="my-videos-empty">No saved videos yet.</p>';
      } else if (grid) {
        grid.innerHTML = '';
        videos.forEach((video) => {
          const card = document.createElement('div');
          card.classList.add('my-video-card');
          card.innerHTML = `
            <video src="${video.video_url}" muted playsinline preload="metadata"></video>
            <div class="my-video-card-title">${video.title}</div>
          `;

          card.addEventListener('mouseenter', () => {
            const v = card.querySelector('video');
            v?.play().catch(() => {});
          });
          card.addEventListener('mouseleave', () => {
            const v = card.querySelector('video');
            if (v) {
              v.pause();
              v.currentTime = 0;
            }
          });

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
      myVideosModal?.classList.remove('active');
      myVideosModal?.setAttribute('aria-hidden', 'true');

      if (typeof window.renderSavedFeed === 'function') {
        window.renderSavedFeed(videos, startId);
      } else {
        window.location.href = `video-hacks.html?video=${startId}`;
      }
    }

    async function handleMyVideosClick(e) {
      e.preventDefault();
      closeDropdowns();
      openMyVideosModal();
    }

    myVideosBtn?.addEventListener('click', handleMyVideosClick);
    myVideosMobileBtn?.addEventListener('click', handleMyVideosClick);

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
      if (!user) {
        showAuthToast('Please log in or create an account to view your profile.');
        return;
      }

      const isGuest = user.email === null;
      const isGoogle = user.app_metadata?.provider === 'google';
      const isEmail = !isGuest && !isGoogle;

      const avatarEl = document.getElementById('profileModalAvatar');
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (avatarEl) {
        avatarEl.innerHTML = avatarUrl
          ? `<img src="${avatarUrl}" alt="avatar">`
          : `<i class="fa-solid fa-user"></i>`;
      }

      const nameEl = document.getElementById('profileModalName');
      if (nameEl) {
        nameEl.textContent = isGuest
          ? 'Guest User'
          : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
      }

      const emailEl = document.getElementById('profileModalEmail');
      if (emailEl) emailEl.textContent = isGuest ? 'Guest Session' : user.email;

      const badge = document.getElementById('profileModalBadge');
      if (badge) {
        badge.textContent = isGuest ? 'Guest' : isGoogle ? 'Google' : 'Email';
        badge.className = `profile-modal-badge ${isGuest ? 'guest' : isGoogle ? 'google' : 'email'}`;
      }

      const joinedEl = document.getElementById('statJoined');
      if (joinedEl) {
        const joined = user.created_at ? new Date(user.created_at) : new Date();
        joinedEl.textContent = joined.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      const sessionId = window.guestSessionId || user.id;

      const { count: savedCount } = await window.supabase
        .from('progress')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId);

      const { count: likedCount } = await window.supabase
        .from('ratings')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId);

      const statSaved = document.getElementById('statSaved');
      const statLiked = document.getElementById('statLiked');
      if (statSaved) statSaved.textContent = savedCount || 0;
      if (statLiked) statLiked.textContent = likedCount || 0;

      const actionsEl = document.getElementById('profileModalActions');
      if (actionsEl) {
        actionsEl.innerHTML = isEmail
          ? `<button class="profile-reset-btn" id="resetPasswordBtn"><i class="fas fa-key"></i> Send Password Reset Email</button>`
          : '';

        if (isEmail) {
          document.getElementById('resetPasswordBtn')?.addEventListener('click', async () => {
            const { error } = await window.supabase.auth.resetPasswordForEmail(user.email);
            if (!error) {
              showAuthToast('Password reset link sent to your email!');
            } else {
              showAuthToast('Error: ' + error.message);
            }
          });
        }
      }

      const deleteBtn = document.getElementById('profileDeleteBtn');
      if (deleteBtn) {
        if (isGuest) {
          deleteBtn.style.display = 'none';
        } else {
          deleteBtn.style.display = 'flex';
          deleteBtn.onclick = async () => {
            const confirmDel = window.confirm('Are you sure you want to sign out and clear your session?');
            if (!confirmDel) return;
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

    profileModal?.addEventListener('click', (e) => {
      if (e.target === profileModal) {
        profileModal.classList.remove('active');
        profileModal.setAttribute('aria-hidden', 'true');
      }
    });

    myVideosModal?.addEventListener('click', (e) => {
      if (e.target === myVideosModal) {
        myVideosModal.classList.remove('active');
        myVideosModal.setAttribute('aria-hidden', 'true');
      }
    });

    async function handleProfileClick(e) {
      e.preventDefault();
      closeDropdowns();
      openProfileModal();
    }

    myProfileBtn?.addEventListener('click', handleProfileClick);
    myProfileMobileBtn?.addEventListener('click', handleProfileClick);

    function showAuthToast(message) {
      const existing = document.getElementById('authToast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'authToast';
      toast.innerHTML = `<i class="fas fa-sparkles" style="color:#3ecfea;"></i> <span>${message}</span>`;
      toast.style.cssText = `
        position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
        background: rgba(18, 20, 26, 0.95); color: white; padding: 14px 24px; border-radius: 12px;
        z-index: 9999; border: 1px solid rgba(62, 207, 234, 0.3);
        font-family: 'Inter', sans-serif; font-size: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        display: flex; align-items: center; gap: 10px;
        backdrop-filter: blur(12px);
        animation: toastIn 0.3s ease;
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    }

    window.showAuthToast = showAuthToast;
    refreshAuthHeader();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDisplayName
  };
}
