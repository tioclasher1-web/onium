const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========== SUPABASE CONFIG ==========
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Jangan buat error jika tidak ada env, tapi kasih warning
let supabase = null;
try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase connected');
    } else {
        console.warn('⚠️ Supabase credentials not set, using in-memory mode');
    }
} catch (error) {
    console.error('❌ Supabase connection error:', error.message);
}

// In-memory fallback (biar gak crash)
let keysData = {};

// ========== DATABASE FUNCTIONS (dengan fallback) ==========
async function getKey(key) {
    // Fallback ke in-memory jika Supabase tidak tersedia
    if (!supabase) {
        return keysData[key] || null;
    }
    
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
        return keysData[key] || null;
    }
}

async function getAllKeys() {
    // Fallback ke in-memory jika Supabase tidak tersedia
    if (!supabase) {
        return keysData;
    }
    
    try {
        const { data, error } = await supabase
            .from('keys')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) return keysData;
        
        const result = {};
        if (data) {
            data.forEach(item => {
                result[item.key] = item;
            });
        }
        return result;
    } catch (error) {
        console.error('getAllKeys error:', error);
        return keysData;
    }
}

async function saveKey(keyData) {
    // Fallback ke in-memory jika Supabase tidak tersedia
    if (!supabase) {
        keysData[keyData.key] = keyData;
        return [keyData];
    }
    
    try {
        const { data, error } = await supabase
            .from('keys')
            .upsert(keyData)
            .select();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('saveKey error:', error);
        keysData[keyData.key] = keyData;
        return [keyData];
    }
}

async function deleteKey(key) {
    // Fallback ke in-memory jika Supabase tidak tersedia
    if (!supabase) {
        delete keysData[key];
        return true;
    }
    
    try {
        const { error } = await supabase
            .from('keys')
            .delete()
            .eq('key', key);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('deleteKey error:', error);
        delete keysData[key];
        return true;
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
        return keyData.active_days || keyData.activeDays;
    }
    
    const firstUsed = new Date(keyData.first_used);
    const now = new Date();
    const diffDays = Math.floor((now - firstUsed) / (1000 * 60 * 60 * 24));
    const remaining = (keyData.active_days || keyData.activeDays) - diffDays;
    
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

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        supabase: supabase ? 'connected' : 'disabled',
        timestamp: new Date().toISOString()
    });
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
                activeDays: keyData.active_days || keyData.activeDays,
                maxDevices: keyData.max_devices || keyData.maxDevices,
                message: 'Key valid'
            });
        }
        
        if (currentDevices >= (keyData.max_devices || keyData.maxDevices)) {
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
            activeDays: keyData.active_days || keyData.activeDays,
            maxDevices: keyData.max_devices || keyData.maxDevices,
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

// ========== SERVE HTML (sederhana dulu) ==========
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onium Race - Key Management System</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🏁%3C/text%3E%3C/svg%3E">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh}
        .container{display:flex;min-height:100vh}
        .sidebar{width:250px;background:#1a1a2e;color:#fff;padding:20px}
        .sidebar h2{text-align:center;margin-bottom:30px}
        .nav-link{display:block;padding:12px;margin:5px 0;background:#2c3e50;border-radius:8px;cursor:pointer;text-align:center}
        .nav-link.active{background:#667eea}
        .main-content{flex:1;padding:20px}
        .page{display:none}
        .page.active{display:block}
        .card{background:#fff;border-radius:10px;padding:20px;margin-bottom:20px}
        .form-group{margin-bottom:15px}
        .form-group label{display:block;margin-bottom:5px}
        .form-group input{width:100%;padding:10px;border:1px solid #ddd;border-radius:5px}
        button{background:#667eea;color:#fff;padding:10px 20px;border:none;border-radius:5px;cursor:pointer}
        table{width:100%;border-collapse:collapse}
        th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}
        .status-active{color:green}
        .status-expired{color:red}
        .delete-btn{background:#dc3545;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer}
        .stats{display:flex;gap:20px;margin-bottom:20px}
        .stat-card{background:#fff;padding:20px;border-radius:10px;flex:1;text-align:center}
        .stat-number{font-size:32px;font-weight:bold;color:#667eea}
    </style>
</head>
<body>
<div class="container">
    <div class="sidebar">
        <h2>🏁 Onium Race</h2>
        <div class="nav-link active" data-page="dashboard">📊 Dashboard</div>
        <div class="nav-link" data-page="getkey">🔑 Get Key</div>
        <div class="nav-link" data-page="reset">🔄 Reset Key</div>
    </div>
    <div class="main-content">
        <div id="dashboard" class="page active">
            <div class="stats">
                <div class="stat-card"><div class="stat-number" id="totalKeys">0</div><div>Total Keys</div></div>
                <div class="stat-card"><div class="stat-number" id="activeKeys">0</div><div>Active Keys</div></div>
                <div class="stat-card"><div class="stat-number" id="expiredKeys">0</div><div>Expired Keys</div></div>
            </div>
            <div class="card"><h3>📋 Daftar Key</h3><table id="keysTable"><thead><tr><th>Key</th><th>Device</th><th>Sisa Hari</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="keysTableBody"><tr><td colspan="5">Loading...</td></tr></tbody></table></div>
        </div>
        <div id="getkey" class="page"><div class="card"><h3>🎁 Get New Key</h3><form id="generateKeyForm"><div class="form-group"><label>Masa Aktif (Hari)</label><input type="number" id="activeDays" required min="1"></div><div class="form-group"><label>Max Device</label><input type="number" id="maxDevices" required min="1"></div><button type="submit">Get Key 🚀</button></form><div id="keyResult"></div></div></div>
        <div id="reset" class="page"><div class="card"><h3>🔄 Reset Key</h3><input type="text" id="resetKeyInput" placeholder="Masukkan Key" style="width:100%;padding:10px;margin-bottom:10px"><button id="resetBtn">Reset Device</button><div id="resetMessage"></div></div></div>
    </div>
</div>
<script>
let currentResetKey=null;
async function loadKeys(){try{const res=await fetch('/api/keys');const keys=await res.json();const tbody=document.getElementById('keysTableBody');let total=0,active=0,expired=0;if(Object.keys(keys).length===0){tbody.innerHTML='<tr><td colspan="5">Belum ada key</td></tr>';}else{tbody.innerHTML='';for(const[key,data]of Object.entries(keys)){total++;if(data.status==='Aktif')active++;if(data.status==='Expired')expired++;tbody.innerHTML+='<tr><td><strong>'+key+'</strong></td><td>'+data.usedDevices+'/'+data.maxDevices+'</td><td>'+data.remainingDays+'</td><td>'+data.status+'</td><td><button class="delete-btn" onclick="deleteKey(\\''+key+'\\')">Hapus</button></td></tr>';}}document.getElementById('totalKeys').textContent=total;document.getElementById('activeKeys').textContent=active;document.getElementById('expiredKeys').textContent=expired;}catch(e){console.error(e);}}
async function deleteKey(key){if(confirm('Hapus key '+key+'?')){await fetch('/api/delete-key/'+encodeURIComponent(key),{method:'DELETE'});loadKeys();}}
document.getElementById('generateKeyForm').addEventListener('submit',async(e)=>{e.preventDefault();const activeDays=document.getElementById('activeDays').value;const maxDevices=document.getElementById('maxDevices').value;const res=await fetch('/api/generate-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activeDays,maxDevices})});const result=await res.json();if(result.success){document.getElementById('keyResult').innerHTML='<div style="background:#e0e0e0;padding:15px;margin-top:15px;border-radius:5px"><h4>✅ Key Berhasil!</h4><p><strong>Key:</strong> '+result.key+'</p><p>Masa Aktif: '+result.activeDays+' hari</p><p>Max Device: '+result.maxDevices+'</p></div>';loadKeys();document.getElementById('activeDays').value='';document.getElementById('maxDevices').value='';setTimeout(()=>{document.getElementById('keyResult').innerHTML='';},5000);}else{alert(result.error);}});
document.getElementById('resetBtn').addEventListener('click',async()=>{const key=document.getElementById('resetKeyInput').value.trim();if(!key){alert('Masukkan key');return;}if(confirm('Reset device untuk key '+key+'?')){const res=await fetch('/api/reset-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});const result=await res.json();if(result.success){alert('Key berhasil direset!');document.getElementById('resetKeyInput').value='';loadKeys();}else{alert(result.error);}}});
document.querySelectorAll('.nav-link').forEach(link=>{link.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));link.classList.add('active');document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(link.dataset.page).classList.add('active');if(link.dataset.page==='dashboard')loadKeys();});});
loadKeys();
</script>
</body>
</html>
    `);
});

// ========== EKSPOR UNTUK VERCEL ==========
module.exports = app;

// Untuk running lokal
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
}
