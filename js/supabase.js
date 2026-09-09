// Get keys from environment config (js/config.js) with fallback defaults
const supabaseUrl = window.ENV?.SUPABASE_URL || 'https://wtgrqxwaahavoiwrbdrg.supabase.co';
const supabaseKey = window.ENV?.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Z3JxeHdhYWhhdm9pd3JiZHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTQzNTEsImV4cCI6MjA5MTY3MDM1MX0.z2QWpBR7cZWX8bxN9D9OUAuF-E2ohAKr00B1Tu-SVn8';

let isSupabaseInitialized = false;

// Wait for Supabase library to load and initialize client
function initializeSupabase() {
  if (isSupabaseInitialized && window.supabase && window.supabase.auth) {
    return window.supabase;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing. Check js/config.js');
    return null;
  }

  // Preserve library constructor if available
  const supabaseLib = window.supabaseLib || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase : null);
  if (supabaseLib) {
    window.supabaseLib = supabaseLib;
  }

  if (!window.supabaseLib || typeof window.supabaseLib.createClient !== 'function') {
    // Retry shortly if library script is still downloading
    setTimeout(initializeSupabase, 50);
    return null;
  }

  try {
    const supabaseClient = window.supabaseLib.createClient(supabaseUrl, supabaseKey);
    window.supabaseClient = supabaseClient;
    window.supabase = supabaseClient;
    isSupabaseInitialized = true;
    window.dispatchEvent(new CustomEvent('supabase:ready', { detail: supabaseClient }));
    return supabaseClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
}

// Initialize when script executes or when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}