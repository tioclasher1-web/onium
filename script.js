// Supabase configuration - GANTI DENGAN PUNYA ANDA
const SUPABASE_URL = 'https://awikwxarhdklwvfhhglh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fGcIM1WXdT8o1LBZfiAqow_W4ylCyvr';


let supabase;

// Generate random key
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ONIUM-RACE-${result}`;
}

// Calculate remaining days
function getRemainingDays(createdAt, activeDays) {
    if (!createdAt) return activeDays;
    const diffDays = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    const remaining = activeDays - diffDays;
    return remaining < 0 ? 0 : remaining;
}

// Get key status
function getKeyStatus(createdAt, activeDays) {
    if (!createdAt) return 'Belum Aktif';
    return getRemainingDays(createdAt, activeDays) <= 0 ? 'Expired' : 'Aktif';
}

// Load all keys from Supabase
async function loadKeys() {
    try {
        const { data, error } = await supabase
            .from('keys')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error loading keys:', error);
        return [];
    }
}

// Render dashboard
async function renderDashboard() {
    const keys = await loadKeys();
    const tbody = document.getElementById('keysTableBody');
    const totalKeys = keys.length;
    let activeKeys = 0, expiredKeys = 0;
    
    if (totalKeys === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada key</td></tr>';
    } else {
        tbody.innerHTML = '';
        for (const keyData of keys) {
            const status = getKeyStatus(keyData.created_at, keyData.active_days);
            if (status === 'Aktif') activeKeys++;
            if (status === 'Expired') expiredKeys++;
            
            const usedDevices = keyData.devices ? Object.keys(keyData.devices).length : 0;
            const statusClass = status === 'Aktif' ? 'status-active' : (status === 'Expired' ? 'status-expired' : 'status-inactive');
            const remainingDays = getRemainingDays(keyData.created_at, keyData.active_days);
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${keyData.key}</strong></td>
                    <td>${usedDevices}/${keyData.max_devices}</td>
                    <td>${remainingDays}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>
                        <button class="reset-device-btn" onclick="resetKeyDevice('${keyData.key}')">Reset Device</button>
                        <button class="delete-btn" onclick="deleteKey('${keyData.key}')">Hapus</button>
                    </td>
                </tr>
            `;
        }
    }
    
    document.getElementById('totalKeys').textContent = totalKeys;
    document.getElementById('activeKeys').textContent = activeKeys;
    document.getElementById('expiredKeys').textContent = expiredKeys;
}

// Generate new key
async function generateNewKey(activeDays, maxDevices) {
    try {
        const newKey = generateKey();
        
        const { error } = await supabase
            .from('keys')
            .insert([{
                key: newKey,
                active_days: parseInt(activeDays),
                max_devices: parseInt(maxDevices),
                devices: {},
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        return { success: true, key: newKey };
    } catch (error) {
        console.error('Error generating key:', error);
        return { success: false, error: error.message };
    }
}

// Reset key device
async function resetKeyDevice(key) {
    if (confirm(`Reset device untuk key ${key}?`)) {
        try {
            const { error } = await supabase
                .from('keys')
                .update({ devices: {}, created_at: new Date().toISOString() })
                .eq('key', key);
            
            if (error) throw error;
            
            showMessage('Device berhasil direset!', 'success', 'resetMessage');
            renderDashboard();
        } catch (error) {
            showMessage('Gagal reset device: ' + error.message, 'error', 'resetMessage');
        }
    }
}

// Delete key
async function deleteKey(key) {
    if (confirm(`Hapus key ${key}?`)) {
        try {
            const { error } = await supabase
                .from('keys')
                .delete()
                .eq('key', key);
            
            if (error) throw error;
            
            showMessage('Key berhasil dihapus', 'success');
            renderDashboard();
        } catch (error) {
            showMessage('Gagal menghapus key: ' + error.message, 'error');
        }
    }
}

// Show message
function showMessage(message, type, elementId = 'generateMessage') {
    const msgDiv = document.getElementById(elementId);
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.className = `message ${type} show`;
        setTimeout(() => msgDiv.classList.remove('show'), 3000);
    }
}

// Initialize Supabase
async function initSupabase() {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test connection
        const { error } = await supabase.from('keys').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        document.getElementById('apiStatus').innerHTML = '✅ Connected to Supabase';
        document.getElementById('apiStatus').style.color = '#0f0';
        return true;
    } catch (error) {
        console.error('Supabase connection error:', error);
        document.getElementById('apiStatus').innerHTML = '❌ Connection failed: Check credentials';
        document.getElementById('apiStatus').style.color = '#f00';
        return false;
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            
            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected page, hide others
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            const selectedPage = document.getElementById(pageId);
            if (selectedPage) {
                selectedPage.classList.add('active');
            }
            
            // Refresh dashboard if needed
            if (pageId === 'dashboard') {
                renderDashboard();
            }
        });
    });
}

// Event listeners
function setupEventListeners() {
    // Generate key form
    const generateForm = document.getElementById('generateKeyForm');
    if (generateForm) {
        generateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const activeDays = parseInt(document.getElementById('activeDays').value);
            const maxDevices = parseInt(document.getElementById('maxDevices').value);
            
            if (activeDays <= 0 || maxDevices <= 0) {
                showMessage('Nilai tidak valid', 'error', 'generateMessage');
                return;
            }
            
            const result = await generateNewKey(activeDays, maxDevices);
            
            if (result.success) {
                document.getElementById('generatedKey').textContent = result.key;
                document.getElementById('resultDays').textContent = activeDays;
                document.getElementById('resultDevices').textContent = maxDevices;
                document.getElementById('keyResult').classList.add('show');
                document.getElementById('activeDays').value = '';
                document.getElementById('maxDevices').value = '';
                setTimeout(() => document.getElementById('keyResult').classList.remove('show'), 5000);
                renderDashboard();
                showMessage('Key berhasil dibuat!', 'success', 'generateMessage');
            } else {
                showMessage('Gagal membuat key: ' + result.error, 'error', 'generateMessage');
            }
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const key = document.getElementById('resetKeyInput').value.trim();
            if (!key) {
                showMessage('Masukkan key', 'error', 'resetMessage');
                return;
            }
            await resetKeyDevice(key);
            document.getElementById('resetKeyInput').value = '';
        });
    }
}

// Expose API for Lua executor
window.OniumAPI = {
    validateKey: async (key, deviceId, deviceName) => {
        try {
            const { data: keyData, error } = await supabase
                .from('keys')
                .select('*')
                .eq('key', key)
                .single();
            
            if (error || !keyData) {
                return { success: false, valid: false, error: 'Key tidak valid' };
            }
            
            const remainingDays = getRemainingDays(keyData.created_at, keyData.active_days);
            if (remainingDays <= 0) {
                return { success: false, valid: false, error: 'Key expired' };
            }
            
            const devices = keyData.devices || {};
            
            if (devices[deviceId]) {
                return { 
                    success: true, valid: true, remainingDays, 
                    activeDays: keyData.active_days, 
                    maxDevices: keyData.max_devices 
                };
            }
            
            if (Object.keys(devices).length >= keyData.max_devices) {
                return { 
                    success: false, valid: false, needReset: true, 
                    error: 'Batas device tercapai' 
                };
            }
            
            devices[deviceId] = { 
                deviceId, 
                deviceName: deviceName || 'Unknown', 
                usedAt: new Date().toISOString() 
            };
            
            await supabase.from('keys').update({ devices }).eq('key', key);
            
            return { 
                success: true, valid: true, remainingDays, 
                activeDays: keyData.active_days, 
                maxDevices: keyData.max_devices 
            };
        } catch (error) {
            return { success: false, valid: false, error: error.message };
        }
    },
    
    getAllKeys: async () => {
        const { data } = await supabase.from('keys').select('*');
        return data || [];
    },
    
    generateKey: async (activeDays, maxDevices) => {
        const newKey = generateKey();
        const { error } = await supabase.from('keys').insert([{
            key: newKey,
            active_days: parseInt(activeDays),
            max_devices: parseInt(maxDevices),
            devices: {},
            created_at: new Date().toISOString()
        }]);
        if (error) return { success: false, error: error.message };
        return { success: true, key: newKey };
    },
    
    resetKey: async (key) => {
        const { error } = await supabase
            .from('keys')
            .update({ devices: {}, created_at: new Date().toISOString() })
            .eq('key', key);
        if (error) return { success: false, error: error.message };
        return { success: true };
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App starting...');
    setupNavigation();
    setupEventListeners();
    await initSupabase();
    await renderDashboard();
    
    // Auto refresh dashboard every 5 seconds
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) {
            renderDashboard();
        }
    }, 5000);
});
