// js/cookies.js

function getOrCreateSessionId() {
    // Check natin kung may naka-save na Guest ID sa browser
    let sessionId = localStorage.getItem('caphacks_guest_session');
    
    // Kung wala pa, gagawa tayo ng bago
    if (!sessionId) {
        // Gagawa ng random string tulad ng "guest_7b3p9..."
        sessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
        // Ise-save sa browser
        localStorage.setItem('caphacks_guest_session', sessionId);
    }
    
    return sessionId;
}

// Gawin nating available sa buong website yung ID
window.guestSessionId = getOrCreateSessionId();
console.log("Welcome! Ang Guest ID mo ay:", window.guestSessionId);