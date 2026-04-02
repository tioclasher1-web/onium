const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ========== SUPABASE CONFIG ==========
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Cek apakah environment variables tersedia
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ ERROR: SUPABASE_URL atau SUPABASE_ANON_KEY tidak diset di environment variables!');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

// ========== DATABASE FUNCTIONS ==========
async function getKey(key) {
    try {
        const { data, error } = await supabase
            .from('keys')
            .select('*')
            .eq('key', key)
            .single();
        
        if (error) return null;
        return data;
    } catch (error) {
        console.error('getKey error:', error);
        return null;
    }
}

async function getAllKeys() {
    try {
        const { data, error } = await supabase
            .from('keys')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) return {};
        
        const result = {};
        if (data) {
            data.forEach(item => {
                result[item.key] = item;
            });
        }
        return result;
    } catch (error) {
        console.error('getAllKeys error:', error);
        return {};
    }
}

async function saveKey(keyData) {
    try {
        const { data, error } = await supabase
            .from('keys')
            .upsert(keyData)
            .select();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('saveKey error:', error);
        throw error;
    }
}

async function deleteKey(key) {
    try {
        const { error } = await supabase
            .from('keys')
            .delete()
            .eq('key', key);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('deleteKey error:', error);
        throw error;
    }
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
        console.error('/api/keys error:', error);
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
        console.error('/api/generate-key error:', error);
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
        
        if (keyData.first_used) {
            const remaining = getRemainingDays(keyData);
            if (remaining <= 0) {
                return res.status(403).json({ error: 'Key sudah expired', valid: false });
            }
        }
        
        const devices = keyData.devices || {};
        const currentDevices = Object.keys(devices).length;
        
        if (devices[deviceId]) {
            return res.json({
                valid: true,
                remainingDays: getRemainingDays(keyData),
                activeDays: keyData.active_days,
                maxDevices: keyData.max_devices,
                message: 'Key valid'
            });
        }
        
        if (currentDevices >= keyData.max_devices) {
            return res.status(403).json({
                error: 'Batas device tercapai',
                valid: false,
                needReset: true
            });
        }
        
        let firstUsed = keyData.first_used;
        if (!firstUsed) {
            firstUsed = new Date().toISOString();
        }
        
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
        console.error('/api/use-key error:', error);
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
        console.error('/api/reset-key error:', error);
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
        console.error('/api/delete-key error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVE HTML ==========
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onium Race - Key Management System</title>
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
        }
        .sidebar h2 { text-align: center; margin-bottom: 30px; }
        .nav-link {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            color: #ecf0f1;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 10px;
        }
        .nav-link:hover { background: rgba(255,255,255,0.1); }
        .nav-link.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .nav-link .emoji { margin-right: 12px; font-size: 20px; }
        .main-content { flex: 1; padding: 30px; overflow-y: auto; }
        .page { display: none; }
        .page.active { display: block; }
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .card h3 { margin-bottom: 20px; color: #333; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 500; }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        .key-result {
            margin-top: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            display: none;
        }
        .key-result.show { display: block; }
        .key-display {
            font-family: monospace;
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; }
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
            padding: 6px 12px;
            font-size: 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
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
        }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
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
            .sidebar h2, .nav-link span:not(.emoji) { display: none; }
            .nav-link .emoji { margin-right: 0; font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>🏁 Onium Race</h2>
            <div class="nav-link active" data-page="dashboard">
                <span class="emoji">📊</span><span>Dashboard</span>
            </div>
            <div class="nav-link" data-page="getkey">
                <span class="emoji">🔑</span><span>Get Key</span>
            </div>
            <div class="nav-link" data-page="reset">
                <span class="emoji">🔄</span><span>Reset Key</span>
            </div>
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
                            <tbody id="keysTableBody"><tr><td colspan="5">Loading...</td></tr>
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
                        <p>🎉 Terima kasih sudah membeli VIP kami!</p>
                    </div>
                    <div id="generateMessage" class="message"></div>
                </div>
            </div>
            
            <div id="reset" class="page">
                <div class="card">
                    <h3>🔄 Reset Key Device</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="resetKeyInput" placeholder="Masukkan Key" style="flex:1; padding:12px; border:2px solid #e0e0e0; border-radius:8px;">
                        <button id="resetBtn">Reset Device</button>
                    </div>
                    <div id="resetMessage" class="message"></div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function loadKeys() {
            try {
                const res = await fetch('/api/keys');
                const keys = await res.json();
                const tbody = document.getElementById('keysTableBody');
                let total = 0, active = 0, expired = 0;
                
                if (Object.keys(keys).length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5">Belum ada key</td></tr>';
                } else {
                    tbody.innerHTML = '';
                    for (const [key, data] of Object.entries(keys)) {
                        total++;
                        if (data.status === 'Aktif') active++;
                        if (data.status === 'Expired') expired++;
                        const statusClass = data.status === 'Aktif' ? 'status-active' : (data.status === 'Expired' ? 'status-expired' : 'status-inactive');
                        tbody.innerHTML += \`
                            <tr>
                                <td><strong>\${key}</strong></td>
                                <td>\${data.usedDevices}/\${data.maxDevices}</td>
                                <td>\${data.remainingDays}</td>
                                <td><span class="status-badge \${statusClass}">\${data.status}</span></td>
                                <td><button class="delete-btn" onclick="deleteKey('\${key}')">Hapus</button></td>
                            </tr>
                        \`;
                    }
                }
                document.getElementById('totalKeys').textContent = total;
                document.getElementById('activeKeys').textContent = active;
                document.getElementById('expiredKeys').textContent = expired;
            } catch(e) { console.error(e); }
        }
        
        async function deleteKey(key) {
            if (confirm(\`Hapus key \${key}?\`)) {
                await fetch(\`/api/delete-key/\${encodeURIComponent(key)}\`, { method: 'DELETE' });
                loadKeys();
            }
        }
        
        document.getElementById('generateKeyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const activeDays = document.getElementById('activeDays').value;
            const maxDevices = document.getElementById('maxDevices').value;
            const res = await fetch('/api/generate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeDays, maxDevices })
            });
            const result = await res.json();
            if (result.success) {
                document.getElementById('generatedKey').textContent = result.key;
                document.getElementById('resultDays').textContent = result.activeDays;
                document.getElementById('resultDevices').textContent = result.maxDevices;
                document.getElementById('keyResult').classList.add('show');
                loadKeys();
                setTimeout(() => document.getElementById('keyResult').classList.remove('show'), 5000);
                document.getElementById('activeDays').value = '';
                document.getElementById('maxDevices').value = '';
            } else {
                alert(result.error);
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', async () => {
            const key = document.getElementById('resetKeyInput').value.trim();
            if (!key) { alert('Masukkan key'); return; }
            if (confirm(\`Reset device untuk key \${key}?\`)) {
                const res = await fetch('/api/reset-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key })
                });
                const result = await res.json();
                if (result.success) {
                    alert('Key berhasil direset!');
                    document.getElementById('resetKeyInput').value = '';
                    loadKeys();
                } else {
                    alert(result.error);
                }
            }
        });
        
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
        
        loadKeys();
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) loadKeys();
        }, 10000);
    </script>
</body>
</html>`);
});

// ========== EKSPOR UNTUK VERCEL ==========
module.exports = app;

// Untuk running lokal
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
