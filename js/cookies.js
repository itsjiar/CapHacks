function getOrCreateSessionId() {
  let sessionId = null;
  try {
    if (typeof localStorage !== 'undefined') {
      sessionId = localStorage.getItem('caphacks_guest_session');
    }
  } catch (e) {
    console.warn('localStorage access failed:', e);
  }

  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('caphacks_guest_session', sessionId);
      }
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }
  return sessionId;
}

// Update when user is logged in
async function initSessionId() {
  if (typeof window === 'undefined') return;

  function checkSession() {
    if (!window.supabase || !window.supabase.auth) {
      setTimeout(checkSession, 80);
      return;
    }

    window.supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      if (user && user.email !== null) {
        window.guestSessionId = user.id;
      }
    }).catch(err => {
      console.warn('Session check failed:', err);
    });
  }

  checkSession();
}

if (typeof window !== 'undefined') {
  window.guestSessionId = getOrCreateSessionId();
  initSessionId();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getOrCreateSessionId };
}