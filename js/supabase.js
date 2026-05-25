// Get keys from environment config (js/config.js)
const supabaseUrl = window.ENV?.SUPABASE_URL || '';
const supabaseKey = window.ENV?.SUPABASE_KEY || '';

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