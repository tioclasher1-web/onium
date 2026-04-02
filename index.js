const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ========== SUPABASE CONFIG ==========
// GANTI DENGAN CREDENTIALS SUPABASE ANDA!
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DATABASE FUNCTIONS ==========
async function getKey(key) {
    const { data, error } = await supabase
        .from('keys')
        .select('*')
        .eq('key', key)
        .single();
    
    if (error) return null;
    return data;
}

async function getAllKeys() {
    const { data, error } = await supabase
        .from('keys')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) return {};
    
    const result = {};
    data.forEach(item => {
        result[item.key] = item;
    });
    return result;
}

async function saveKey(keyData) {
    const { data, error } = await supabase
        .from('keys')
        .upsert(keyData)
        .select();
    
    if (error) throw error;
    return data;
}

async function deleteKey(key) {
    const { error } = await supabase
        .from('keys')
        .delete()
        .eq('key', key);
    
    if (error) throw error;
    return true;
}

// ========== HELPER FUNCTIONS ==========
function generateKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `ONIUM-RACE-${result}`;
}

function getRemainingDays(keyData) {
    if (!keyData.first_used) {
        return keyData.active_days;
    }
    
    const firstUsed = new Date(keyData.first_used);
    const now = new Date();
    const diffDays = Math.floor((now - firstUsed) / (1000 * 60 * 60 * 24));
    const remaining = keyData.active_days - diffDays;
    
    return remaining < 0 ? 0 : remaining;
}

function getKeyStatus(keyData) {
    if (!keyData.first_used) {
        return 'Belum Aktif';
    }
    
    const remaining = getRemainingDays(keyData);
    if (remaining <= 0) return 'Expired';
    return 'Aktif';
}

// ========== API ENDPOINTS ==========
app.get('/api/keys', async (req, res) => {
    try {
        const keys = await getAllKeys();
        const keysWithInfo = {};
        
        for (const [key, data] of Object.entries(keys)) {
            keysWithInfo[key] = {
                ...data,
                remainingDays: getRemainingDays(data),
                status: getKeyStatus(data),
                usedDevices: data.devices ? Object.keys(data.devices).length : 0
            };
        }
        
        res.json(keysWithInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate-key', async (req, res) => {
    try {
        const { activeDays, maxDevices } = req.body;
        
        if (!activeDays || !maxDevices) {
            return res.status(400).json({ error: 'Harap isi semua field' });
        }
        
        const days = parseInt(activeDays);
        const devices = parseInt(maxDevices);
        
        if (isNaN(days) || isNaN(devices) || days <= 0 || devices <= 0) {
            return res.status(400).json({ error: 'Nilai tidak valid' });
        }
        
        let newKey = generateKey();
        let existing = await getKey(newKey);
        
        while (existing) {
            newKey = generateKey();
            existing = await getKey(newKey);
        }
        
        const keyData = {
            key: newKey,
            active_days: days,
            max_devices: devices,
            first_used: null,
            devices: {},
            created_at: new Date().toISOString()
        };
        
        await saveKey(keyData);
        
        res.json({
            success: true,
            key: newKey,
            activeDays: days,
            maxDevices: devices,
            message: 'Terima kasih sudah membeli VIP kami'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/use-key', async (req, res) => {
    try {
        const { key, deviceId, deviceName } = req.body;
        
        if (!key || !deviceId) {
            return res.status(400).json({ error: 'Key dan Device ID diperlukan' });
        }
        
        const keyData = await getKey(key);
        
        if (!keyData) {
            return res.status(404).json({ error: 'Key tidak valid', valid: false });
        }
        
        // Cek expired
        if (keyData.first_used) {
            const remaining = getRemainingDays(keyData);
            if (remaining <= 0) {
                return res.status(403).json({ error: 'Key sudah expired', valid: false });
            }
        }
        
        const devices = keyData.devices || {};
        const currentDevices = Object.keys(devices).length;
        
        // Cek device sudah terdaftar
        if (devices[deviceId]) {
            return res.json({
                valid: true,
                remainingDays: getRemainingDays(keyData),
                activeDays: keyData.active_days,
                maxDevices: keyData.max_devices,
                message: 'Key valid'
            });
        }
        
        // Cek slot device
        if (currentDevices >= keyData.max_devices) {
            return res.status(403).json({
                error: 'Batas device tercapai',
                valid: false,
                needReset: true
            });
        }
        
        // First time use
        let firstUsed = keyData.first_used;
        if (!firstUsed) {
            firstUsed = new Date().toISOString();
        }
        
        // Register device
        devices[deviceId] = {
            deviceId: deviceId,
            deviceName: deviceName || 'Unknown',
            usedAt: new Date().toISOString()
        };
        
        await saveKey({
            ...keyData,
            first_used: firstUsed,
            devices: devices
        });
        
        res.json({
            valid: true,
            remainingDays: getRemainingDays({ ...keyData, first_used: firstUsed }),
            activeDays: keyData.active_days,
            maxDevices: keyData.max_devices,
            message: 'Key berhasil diaktifkan'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reset-key', async (req, res) => {
    try {
        const { key } = req.body;
        
        if (!key) {
            return res.status(400).json({ error: 'Key diperlukan' });
        }
        
        const keyData = await getKey(key);
        
        if (!keyData) {
            return res.status(404).json({ error: 'Key tidak ditemukan' });
        }
        
        await saveKey({
            ...keyData,
            devices: {},
            first_used: null
        });
        
        res.json({
            success: true,
            message: 'Key berhasil direset'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/delete-key/:key', async (req, res) => {
    try {
        const { key } = req.params;
        await deleteKey(key);
        
        res.json({
            success: true,
            message: 'Key berhasil dihapus'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVE HTML DASHBOARD ==========
// 🔥 GANTI URL DI BAWAH INI DENGAN LINK GAMBAR ANDA!
const LOGO_URL = 'https://cdn.discordapp.com/attachments/1365640947433603112/1489269363587678208/ChatGPT_Image_Apr_2_2026_09_22_56_PM.png';
const FAVICON_URL = 'https://cdn.discordapp.com/attachments/1365640947433603112/1489269363587678208/ChatGPT_Image_Apr_2_2026_09_22_56_PM.png';

const htmlTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onium Race - Key Management System</title>
    
    <!-- FAVICON - Support semua jenis link -->
    <link rel="icon" type="image/png" href="${FAVICON_URL}">
    <link rel="shortcut icon" type="image/png" href="${FAVICON_URL}">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🏁%3C/text%3E%3C/svg%3E">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { display: flex; min-height: 100vh; }
        .sidebar {
            width: 280px;
            background: linear-gradient(180deg, #2c3e50 0%, #1a1a2e 100%);
            color: white;
            padding: 30px 20px;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        }
        .sidebar-logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .sidebar-logo img {
            max-width: 80px;
            height: auto;
            border-radius: 50%;
            margin-bottom: 10px;
            border: 3px solid #667eea;
            object-fit: cover;
        }
        .sidebar-logo .logo-text {
            display: none;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }
        .sidebar-logo .logo-text span { font-size: 40px; }
        .sidebar-logo .logo-text h2 { margin: 0; }
        .sidebar h2 { text-align: center; margin-bottom: 30px; font-size: 20px; }
        .nav-menu { list-style: none; }
        .nav-item { margin-bottom: 15px; }
        .nav-link {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            color: #ecf0f1;
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .nav-link:hover { background: rgba(255,255,255,0.1); transform: translateX(5px); }
        .nav-link.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .nav-link .emoji { margin-right: 12px; font-size: 20px; }
        .main-content { flex: 1; padding: 30px; overflow-y: auto; }
        .page { display: none; animation: fadeIn 0.5s ease; }
        .page.active { display: block; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .card h3 { margin-bottom: 20px; color: #333; font-size: 22px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 500; }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .form-group input:focus { outline: none; border-color: #667eea; }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        button:hover { transform: translateY(-2px); }
        .key-result {
            margin-top: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            display: none;
        }
        .key-result.show { display: block; animation: slideDown 0.5s ease; }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .key-display {
            font-family: monospace;
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
            word-break: break-all;
        }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; font-weight: 600; }
        tr:hover { background: #f8f9fa; }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-active { background: #d4edda; color: #155724; }
        .status-expired { background: #f8d7da; color: #721c24; }
        .status-inactive { background: #fff3cd; color: #856404; }
        .delete-btn {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .delete-btn:hover { opacity: 0.8; transform: none; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal.show { display: flex; }
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
        }
        .modal-buttons { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
        .btn-cancel { background: #6c757d; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; }
        .btn-cancel:hover { transform: none; }
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
        }
        .message.show { display: block; }
        .message.success { background: #d4edda; color: #155724; }
        .message.error { background: #f8d7da; color: #721c24; }
        @media (max-width: 768px) {
            .sidebar { width: 80px; padding: 20px 10px; }
            .sidebar-logo img { max-width: 50px; }
            .sidebar-logo .logo-text h2, .sidebar > h2, .nav-link span:not(.emoji) { display: none; }
            .nav-link { justify-content: center; }
            .nav-link .emoji { margin-right: 0; font-size: 24px; }
            .main-content { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <div class="sidebar-logo">
                <img src="${LOGO_URL}" alt="Logo Onium Race" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="logo-text">
                    <span>🏁</span>
                    <h2>Onium Race</h2>
                </div>
            </div>
            <h2>🏁 Onium Race</h2>
            <ul class="nav-menu">
                <li class="nav-item"><div class="nav-link active" data-page="dashboard"><span class="emoji">📊</span><span>Dashboard</span></div></li>
                <li class="nav-item"><div class="nav-link" data-page="getkey"><span class="emoji">🔑</span><span>Get Key</span></div></li>
                <li class="nav-item"><div class="nav-link" data-page="reset"><span class="emoji">🔄</span><span>Reset Key</span></div></li>
            </ul>
        </div>
        
        <div class="main-content">
            <div id="dashboard" class="page active">
                <div class="stats">
                    <div class="stat-card"><div class="stat-number" id="totalKeys">0</div><div class="stat-label">Total Keys</div></div>
                    <div class="stat-card"><div class="stat-number" id="activeKeys">0</div><div class="stat-label">Active Keys</div></div>
                    <div class="stat-card"><div class="stat-number" id="expiredKeys">0</div><div class="stat-label">Expired Keys</div></div>
                </div>
                <div class="card">
                    <h3>📋 Daftar Key</h3>
                    <div class="table-container">
                        <table id="keysTable">
                            <thead><tr><th>Key</th><th>Device Used</th><th>Sisa Hari</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody id="keysTableBody"><tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div id="getkey" class="page">
                <div class="card">
                    <h3>🎁 Get New Key</h3>
                    <form id="generateKeyForm">
                        <div class="form-group">
                            <label>Masa Aktif (Hari)</label>
                            <input type="number" id="activeDays" required min="1" placeholder="Contoh: 30">
                        </div>
                        <div class="form-group">
                            <label>Jumlah Maksimal Device</label>
                            <input type="number" id="maxDevices" required min="1" placeholder="Contoh: 2">
                        </div>
                        <button type="submit">Get Key 🚀</button>
                    </form>
                    <div id="keyResult" class="key-result">
                        <h4>✅ Key Berhasil Dibuat!</h4>
                        <div class="key-display" id="generatedKey"></div>
                        <p><strong>Masa Aktif:</strong> <span id="resultDays"></span> hari</p>
                        <p><strong>Max Device:</strong> <span id="resultDevices"></span> device</p>
                        <p style="color: #667eea; margin-top: 15px;">🎉 Terima kasih sudah membeli VIP kami!</p>
                    </div>
                    <div id="generateMessage" class="message"></div>
                </div>
            </div>
            
            <div id="reset" class="page">
                <div class="card">
                    <h3>🔄 Reset Key Device</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="resetKeyInput" placeholder="Masukkan Key (contoh: ONIUM-RACE-ABCDE)" style="flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <button id="resetBtn">Reset Device</button>
                    </div>
                    <div id="resetMessage" class="message"></div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="confirmModal" class="modal">
        <div class="modal-content">
            <h3>⚠️ Konfirmasi Reset</h3>
            <p>Apakah Anda yakin ingin mereset key ini?</p>
            <p style="font-size: 14px; color: #666;">Semua device yang terdaftar akan dihapus.</p>
            <div class="modal-buttons">
                <button id="confirmYes" style="background: #dc3545;">Ya, Reset</button>
                <button id="confirmNo" class="btn-cancel">Batal</button>
            </div>
        </div>
    </div>
    
    <script>
        let currentResetKey = null;
        
        async function loadKeys() {
            try {
                const response = await fetch('/api/keys');
                const keys = await response.json();
                
                const tbody = document.getElementById('keysTableBody');
                const totalKeys = Object.keys(keys).length;
                let activeKeys = 0, expiredKeys = 0;
                
                if (totalKeys === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada key</td></tr>';
                } else {
                    tbody.innerHTML = '';
                    for (const [key, data] of Object.entries(keys)) {
                        const status = data.status;
                        if (status === 'Aktif') activeKeys++;
                        if (status === 'Expired') expiredKeys++;
                        
                        const statusClass = status === 'Aktif' ? 'status-active' : (status === 'Expired' ? 'status-expired' : 'status-inactive');
                        
                        tbody.innerHTML += `
                            <tr>
                                <td><strong>${key}</strong></td>
                                <td>${data.usedDevices}/${data.maxDevices}</td>
                                <td>${data.remainingDays}</td>
                                <td><span class="status-badge ${statusClass}">${status}</span></td>
                                <td><button class="delete-btn" onclick="deleteKey('${key}')">Hapus</button></td>
                            </tr>
                        `;
                    }
                }
                
                document.getElementById('totalKeys').textContent = totalKeys;
                document.getElementById('activeKeys').textContent = activeKeys;
                document.getElementById('expiredKeys').textContent = expiredKeys;
            } catch (error) {
                console.error('Error loading keys:', error);
                document.getElementById('keysTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading data</td></tr>';
            }
        }
        
        async function deleteKey(key) {
            if (confirm(`Yakin ingin menghapus key ${key}?`)) {
                try {
                    const response = await fetch(`/api/delete-key/${encodeURIComponent(key)}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (result.success) {
                        showMessage('Key berhasil dihapus', 'success');
                        loadKeys();
                    } else {
                        showMessage(result.error, 'error');
                    }
                } catch (error) {
                    showMessage('Error menghapus key', 'error');
                }
            }
        }
        
        document.getElementById('generateKeyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const activeDays = document.getElementById('activeDays').value;
            const maxDevices = document.getElementById('maxDevices').value;
            
            try {
                const response = await fetch('/api/generate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activeDays, maxDevices })
                });
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('generatedKey').textContent = result.key;
                    document.getElementById('resultDays').textContent = result.activeDays;
                    document.getElementById('resultDevices').textContent = result.maxDevices;
                    document.getElementById('keyResult').classList.add('show');
                    document.getElementById('generateMessage').classList.remove('show');
                    loadKeys();
                    setTimeout(() => {
                        document.getElementById('keyResult').classList.remove('show');
                    }, 5000);
                    document.getElementById('activeDays').value = '';
                    document.getElementById('maxDevices').value = '';
                } else {
                    showMessage(result.error, 'error', 'generateMessage');
                }
            } catch (error) {
                showMessage('Error generating key', 'error', 'generateMessage');
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            const key = document.getElementById('resetKeyInput').value.trim();
            if (!key) {
                showMessage('Masukkan key terlebih dahulu', 'error', 'resetMessage');
                return;
            }
            currentResetKey = key;
            document.getElementById('confirmModal').classList.add('show');
        });
        
        document.getElementById('confirmYes').addEventListener('click', async () => {
            document.getElementById('confirmModal').classList.remove('show');
            try {
                const response = await fetch('/api/reset-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: currentResetKey })
                });
                const result = await response.json();
                if (result.success) {
                    showMessage('Key berhasil direset! Device telah dihapus.', 'success', 'resetMessage');
                    document.getElementById('resetKeyInput').value = '';
                    loadKeys();
                } else {
                    showMessage(result.error, 'error', 'resetMessage');
                }
            } catch (error) {
                showMessage('Error resetting key', 'error', 'resetMessage');
            }
            currentResetKey = null;
        });
        
        document.getElementById('confirmNo').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('show');
            currentResetKey = null;
        });
        
        function showMessage(message, type, elementId = 'generateMessage') {
            const msgDiv = document.getElementById(elementId);
            msgDiv.textContent = message;
            msgDiv.className = `message ${type} show`;
            setTimeout(() => msgDiv.classList.remove('show'), 3000);
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const page = link.dataset.page;
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(page).classList.add('active');
                if (page === 'dashboard') loadKeys();
            });
        });
        
        // Load data
        loadKeys();
        
        // Auto refresh setiap 10 detik
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) {
                loadKeys();
            }
        }, 10000);
    </script>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(htmlTemplate);
});

// ========== UNTUK VERCEL ==========
module.exports = app;

// Untuk running lokal
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`✅ Supabase terhubung`);
        console.log(`📊 Dashboard: http://localhost:${PORT}`);
    });
}
