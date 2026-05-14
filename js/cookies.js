function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('caphacks_guest_session');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('caphacks_guest_session', sessionId);
  }
  return sessionId;
}

async function initSessionId() {
  // Hintayin muna ang Supabase
  if (!window.supabase) {
    setTimeout(initSessionId, 100);
    return;
  }

  const { data } = await window.supabase.auth.getSession();
  const user = data?.session?.user;

  if (user && user.email !== null) {
    // Logged-in user — gamitin yung user.id
    window.guestSessionId = user.id;
  } else {
    // Guest — gamitin yung localStorage session
    window.guestSessionId = getOrCreateSessionId();
  }

  console.log('Session ID:', window.guestSessionId);
}

// Initialize
window.guestSessionId = getOrCreateSessionId(); // default muna
initSessionId(); // then update pag ready ang Supabase