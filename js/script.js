// --- GUEST LOGIN ---
async function loginAsGuest() {
    if (!window.supabase) {
        alert("Authentication service not available. Please try again.");
        return;
    }

    const { data, error } = await window.supabase.auth.signInAnonymously();
    if (data) {
        alert("Logged in as Guest!");
        window.location.href = "video-hacks.html"; // Redirect to your video page
    }
    if (error) {
        alert("Guest login failed: " + error.message);
        console.error("Error:", error.message);
    }
}

// --- LINK TO YOUR BUTTONS ---
document.getElementById('guestAuthBtn')?.addEventListener('click', loginAsGuest);

// Scroll animations
const animatedEls = document.querySelectorAll('[data-animate]');
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

animatedEls.forEach(el => animObserver.observe(el));