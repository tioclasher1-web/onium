// Supabase configuration - GANTI DENGAN PUNYA ANDA
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

let supabase;

// Initialize Supabase
async function initSupabase() {
    try {
        const { createClient } = supabaseJs;
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test connection
        const { data, error } = await supabase.from('keys').select('count', { count: 'exact', head: true });
        if (error) throw error;
        
        document.getElementById('apiStatus').innerHTML = '✅ Connected to Supabase';
        document.getElementById('apiStatus').style.color = '#0f0';
        return true;
    } catch (error) {
        console.error('Supabase connection error:', error);
        document.getElementById('apiStatus').innerHTML = '❌ Supabase connection failed';
        document.getElementById('apiStatus').style.color = '#f00';
        return false;
    }
}

// Generate random key
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
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
        return data;
    } catch (error) {
        console.error('Error loading keys:', error);
        showMessage('Gagal memuat data', 'error');
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
        tbody.innerHTML = '<tr><td colspan="5">Belum ada key</td></tr>';
    } else {
        tbody.innerHTML = '';
        for (const keyData of keys) {
            const status = getKeyStatus(keyData.created_at, keyData.active_days);
            if (status === 'Aktif') activeKeys++;
            if (status === 'Expired') expiredKeys++;
            
            const usedDevices = keyData.devices ? Object.keys(keyData.devices).length : 0;
            const statusClass = status === 'Aktif' ? 'status-active' : (status === 'Expired' ? 'status-expired' : 'status-inactive');
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${keyData.key}</strong></td>
                    <td>${usedDevices}/${keyData.max_devices}</td>
                    <td>${getRemainingDays(keyData.created_at, keyData.active_days)}</td>
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
        
        const { data, error } = await supabase
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
            showMessage('Gagal reset device', 'error', 'resetMessage');
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
            showMessage('Gagal menghapus key', 'error');
        }
    }
}

// Validate/Use key from API
async function validateKey(key, deviceId, deviceName) {
    try {
        // Get key data
        const { data: keyData, error: fetchError } = await supabase
            .from('keys')
            .select('*')
            .eq('key', key)
            .single();
        
        if (fetchError || !keyData) {
            return { success: false, valid: false, error: 'Key tidak valid' };
        }
        
        // Check expired
        const remainingDays = getRemainingDays(keyData.created_at, keyData.active_days);
        if (remainingDays <= 0) {
            return { success: false, valid: false, error: 'Key sudah expired' };
        }
        
        const devices = keyData.devices || {};
        const currentDevices = Object.keys(devices).length;
        
        // Device already registered
        if (devices[deviceId]) {
            return {
                success: true,
                valid: true,
                remainingDays: remainingDays,
                activeDays: keyData.active_days,
                maxDevices: keyData.max_devices,
                message: 'Key valid'
            };
        }
        
        // Check device slot
        if (currentDevices >= keyData.max_devices) {
            return {
                success: false,
                valid: false,
                needReset: true,
                error: 'Batas device tercapai, perlu reset dari website'
            };
        }
        
        // Register device
        devices[deviceId] = {
            deviceId: deviceId,
            deviceName: deviceName || 'Unknown',
            usedAt: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
            .from('keys')
            .update({ devices: devices })
            .eq('key', key);
        
        if (updateError) throw updateError;
        
        return {
            success: true,
            valid: true,
            remainingDays: remainingDays,
            activeDays: keyData.active_days,
            maxDevices: keyData.max_devices,
            message: 'Key berhasil diaktifkan'
        };
    } catch (error) {
        console.error('Validation error:', error);
        return { success: false, valid: false, error: 'Server error' };
    }
}

// Show message
function showMessage(message, type, elementId = 'generateMessage') {
    const msgDiv = document.getElementById(elementId);
    msgDiv.textContent = message;
    msgDiv.className = `message ${type} show`;
    setTimeout(() => msgDiv.classList.remove('show'), 3000);
}

// Event listeners
document.getElementById('generateKeyForm').addEventListener('submit', async (e) => {
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
    } else {
        showMessage('Gagal membuat key: ' + result.error, 'error', 'generateMessage');
    }
});

document.getElementById('resetBtn').addEventListener('click', async () => {
    const key = document.getElementById('resetKeyInput').value.trim();
    if (!key) {
        showMessage('Masukkan key', 'error', 'resetMessage');
        return;
    }
    await resetKeyDevice(key);
    document.getElementById('resetKeyInput').value = '';
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        const page = link.dataset.page;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        if (page === 'dashboard') renderDashboard();
    });
});

// Expose API to window for Lua executor
window.OniumAPI = {
    validateKey: async (key, deviceId, deviceName) => {
        return await validateKey(key, deviceId, deviceName);
    },
    getAllKeys: async () => {
        return await loadKeys();
    }
};

// Load Supabase JS library
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
script.onload = async () => {
    supabaseJs = window.supabase;
    await initSupabase();
    await renderDashboard();
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) renderDashboard();
    }, 5000);
};
document.head.appendChild(script);
