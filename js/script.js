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