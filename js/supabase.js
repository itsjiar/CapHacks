const supabaseUrl = 'https://wtgrqxwaahavoiwrbdrg.supabase.co';
const supabaseKey = 'sb_publishable_fZFNkbJwokPRhMod_bTdVA_Eht_lyO2'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase Connection, GG!", supabaseClient);