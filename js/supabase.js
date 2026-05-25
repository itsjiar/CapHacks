// Get keys from environment config (js/config.js)
const supabaseUrl = window.ENV?.SUPABASE_URL || 'https://wtgrqxwaahavoiwrbdrg.supabase.co';
const supabaseKey = window.ENV?.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Z3JxeHdhYWhhdm9pd3JiZHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTQzNTEsImV4cCI6MjA5MTY3MDM1MX0.z2QWpBR7cZWX8bxN9D9OUAuF-E2ohAKr00B1Tu-SVn8';

// Wait for Supabase library to load
function initializeSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing. Check js/config.js');
    return;
  }

  console.log('Initializing Supabase...');
  console.log('window.supabase available:', !!window.supabase);
  console.log('window.supabase.createClient available:', !!(window.supabase && window.supabase.createClient));

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('Supabase library not loaded yet, retrying...');
    setTimeout(initializeSupabase, 100);
    return;
  }

  try {
    // Create Supabase client
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');

    // Make the client globally available as window.supabaseClient for compatibility
    window.supabaseClient = supabaseClient;
    window.supabase = supabaseClient;

    console.log("Supabase Connection, GG!", supabaseClient);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
  }
}

// Initialize when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}