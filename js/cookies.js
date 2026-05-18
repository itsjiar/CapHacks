function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('caphacks_guest_session');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('caphacks_guest_session', sessionId);
  }
  return sessionId;
}

// Update pag may logged-in user
async function initSessionId() {
  if (typeof window === 'undefined' || !window.supabase || !window.supabase.auth) {
    if (typeof window !== 'undefined') {
      setTimeout(initSessionId, 100);
    }
    return;
  }

  try {
    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;

    if (user && user.email !== null) {
      window.guestSessionId = user.id;
      console.log('Session updated to user ID:', user.id);
    }
  } catch (err) {
    console.warn('Session check failed:', err);
  }
}

if (typeof window !== 'undefined') {
  window.guestSessionId = getOrCreateSessionId();
  console.log('Session ID:', window.guestSessionId);
  initSessionId();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getOrCreateSessionId };
}