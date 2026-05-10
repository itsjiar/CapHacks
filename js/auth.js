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

    if (!window.supabase || !window.supabase.createClient) {
      authError.textContent = 'Unable to initialize auth service.';
      return;
    }

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
      window.location.href = 'video-hacks.html';
    }
  });
});

