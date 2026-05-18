// --- GOOGLE LOGIN ---
// Note: Google login is handled by auth.js for better error handling
// async function loginWithGoogle() {
//     const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: { redirectTo: window.location.origin }
//     });
//     if (error) console.error("Error:", error.message);
// }

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
// Google login is handled by auth.js
// document.getElementById('googleAuthBtn').addEventListener('click', loginWithGoogle);
document.getElementById('guestAuthBtn').addEventListener('click', loginAsGuest);