// Supabase configuration - GANTI DENGAN PUNYA ANDA
const SUPABASE_URL = 'https://awikwxarhdklwvfhhglh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fGcIM1WXdT8o1LBZfiAqow_W4ylCyvr';

let supabase;

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return `ONIUM-RACE-${result}`;
}

function getRemainingDays(createdAt, activeDays) {
    if (!createdAt) return activeDays;
    const diffDays = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    return Math.max(0, activeDays - diffDays);
}

function getKeyStatus(createdAt, activeDays) {
    if (!createdAt) return 'Belum Aktif';
    return getRemainingDays(createdAt, activeDays) <= 0 ? 'Expired' : 'Aktif';
}

async function loadKeys() {
    try {
        const { data, error } = await supabase.from('keys').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error loading keys:', error);
        showMessage('Gagal memuat data: ' + error.message, 'error');
        return [];
    }
}

async function renderDashboard() {
    const keys = await loadKeys();
    const tbody = document.getElementById('keysTableBody');
    let totalKeys = keys.length, activeKeys = 0, expiredKeys = 0;
    
    if (totalKeys === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Belum ada key</td></tr>';
    } else {
        tbody.innerHTML = '';
        for (const keyData of keys) {
            const status = getKeyStatus(keyData.created_at, keyData.active_days);
            if (status === 'Aktif') activeKeys++;
            if (status === 'Expired') expiredKeys++;
            
            const usedDevices = keyData.devices ? Object.keys(keyData.devices).length : 0;
            const statusClass = status === 'Aktif' ? 'status-active' : 'status-expired';
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

async function generateNewKey(activeDays, maxDevices) {
    try {
        const newKey = generateKey();
        const { error } = await supabase.from('keys').insert([{
            key: newKey,
            active_days: parseInt(activeDays),
            max_devices: parseInt(maxDevices),
            devices: {},
            created_at: new Date().toISOString()
        }]);
        if (error) throw error;
        return { success: true, key: newKey };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function resetKeyDevice(key) {
    if (!confirm(`Reset device untuk key ${key}?`)) return;
    try {
        const { error } = await supabase.from('keys').update({ devices: {}, created_at: new Date().toISOString() }).eq('key', key);
        if (error) throw error;
        showMessage('Device berhasil direset!', 'success', 'resetMessage');
        renderDashboard();
    } catch (error) {
        showMessage('Gagal reset device: ' + error.message, 'error', 'resetMessage');
    }
}

async function deleteKey(key) {
    if (!confirm(`Hapus key ${key}?`)) return;
    try {
        const { error } = await supabase.from('keys').delete().eq('key', key);
        if (error) throw error;
        showMessage('Key berhasil dihapus', 'success');
        renderDashboard();
    } catch (error) {
        showMessage('Gagal menghapus key: ' + error.message, 'error');
    }
}

function showMessage(message, type, elementId = 'generateMessage') {
    const msgDiv = document.getElementById(elementId);
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.className = `message ${type} show`;
        setTimeout(() => msgDiv.classList.remove('show'), 3000);
    }
}

async function initSupabase() {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error } = await supabase.from('keys').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') throw error;
        document.getElementById('apiStatus').innerHTML = '✅ Connected to Supabase';
        document.getElementById('apiStatus').style.color = '#0f0';
        return true;
    } catch (error) {
        document.getElementById('apiStatus').innerHTML = '❌ Connection failed';
        document.getElementById('apiStatus').style.color = '#f00';
        return false;
    }
}

// Event Listeners
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
        showMessage('Key berhasil dibuat!', 'success', 'generateMessage');
    } else {
        showMessage('Gagal: ' + result.error, 'error', 'generateMessage');
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

// Start
(async () => {
    await initSupabase();
    await renderDashboard();
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) renderDashboard();
    }, 5000);
})();
