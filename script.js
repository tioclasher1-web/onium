// Supabase configuration - GANTI DENGAN PUNYA ANDA
const SUPABASE_URL = 'https://awikwxarhdklwvfhhglh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fGcIM1WXdT8o1LBZfiAqow_W4ylCyvr';

let supabase;
let supabaseJs; // Tambahkan ini

// Initialize Supabase
async function initSupabase() {
    try {
        // Perbaiki cara panggil createClient
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test connection
        const { data, error } = await supabase.from('keys').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = table empty, bukan error
        
        document.getElementById('apiStatus').innerHTML = '✅ Connected to Supabase';
        document.getElementById('apiStatus').style.color = '#0f0';
        return true;
    } catch (error) {
        console.error('Supabase connection error:', error);
        document.getElementById('apiStatus').innerHTML = '❌ Supabase connection failed: ' + error.message;
        document.getElementById('apiStatus').style.color = '#f00';
        return false;
    }
}

// Rest of your code remains the same...
// (generateKey, getRemainingDays, getKeyStatus, loadKeys, renderDashboard, etc.)

// Load Supabase JS library
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
script.onload = async () => {
    supabaseJs = window.supabase; // Perbaiki ini
    await initSupabase();
    await renderDashboard();
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) renderDashboard();
    }, 5000);
};
document.head.appendChild(script);
