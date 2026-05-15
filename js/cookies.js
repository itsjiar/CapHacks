function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('caphacks_guest_session');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('caphacks_guest_session', sessionId);
  }
  return sessionId;
}

window.guestSessionId = getOrCreateSessionId();
console.log('Session ID:', window.guestSessionId);

// Update pag may logged-in user
async function initSessionId() {
  if (!window.supabase || !window.supabase.auth) {
    setTimeout(initSessionId, 100);
    return;
  }

  try {
    const { data } = await window.supabase.auth.getSession();
    const user = data?.session?.user;
    if (user && user.email !== null) {
      window.guestSessionId = user.id;
    }
  } catch (err) {
    console.warn('Session check failed:', err);
  }
}

initSessionId();