<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onium Race - Key Management System (Cloud Database)</title>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 280px;
            background: linear-gradient(180deg, #2c3e50 0%, #1a1a2e 100%);
            color: white;
            padding: 30px 20px;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        }
        
        .sidebar h2 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 24px;
        }
        
        .nav-menu {
            list-style: none;
        }
        
        .nav-item {
            margin-bottom: 15px;
        }
        
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
        
        .nav-link:hover {
            background: rgba(255,255,255,0.1);
            transform: translateX(5px);
        }
        
        .nav-link.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .nav-link .emoji {
            margin-right: 12px;
            font-size: 20px;
        }
        
        .main-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }
        
        .page {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        .page.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .card h3 {
            margin-bottom: 20px;
            color: #333;
            font-size: 22px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
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
        
        button:hover {
            transform: translateY(-2px);
        }
        
        .key-result {
            margin-top: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            display: none;
        }
        
        .key-result.show {
            display: block;
            animation: slideDown 0.5s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .key-display {
            font-family: monospace;
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        
        .status-expired {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-inactive {
            background: #fff3cd;
            color: #856404;
        }
        
        .delete-btn, .reset-device-btn {
            padding: 6px 12px;
            font-size: 12px;
            margin: 0 5px;
        }
        
        .delete-btn {
            background: #dc3545;
        }
        
        .reset-device-btn {
            background: #ffc107;
            color: #333;
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
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
        }
        
        .message.show {
            display: block;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .api-status {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-family: monospace;
            z-index: 1000;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 80px;
                padding: 20px 10px;
            }
            
            .sidebar h2, .nav-link span:not(.emoji) {
                display: none;
            }
            
            .nav-link {
                justify-content: center;
            }
            
            .nav-link .emoji {
                margin-right: 0;
                font-size: 24px;
            }
            
            .main-content {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>🏁 Onium Race</h2>
            <ul class="nav-menu">
                <li class="nav-item">
                    <div class="nav-link active" data-page="dashboard">
                        <span class="emoji">📊</span>
                        <span>Dashboard</span>
                    </div>
                </li>
                <li class="nav-item">
                    <div class="nav-link" data-page="getkey">
                        <span class="emoji">🔑</span>
                        <span>Get Key</span>
                    </div>
                </li>
                <li class="nav-item">
                    <div class="nav-link" data-page="reset">
                        <span class="emoji">🔄</span>
                        <span>Reset Key</span>
                    </div>
                </li>
            </ul>
        </div>
        
        <div class="main-content">
            <div id="dashboard" class="page active">
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number" id="totalKeys">0</div>
                        <div class="stat-label">Total Keys</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="activeKeys">0</div>
                        <div class="stat-label">Active Keys</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="expiredKeys">0</div>
                        <div class="stat-label">Expired Keys</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📋 Daftar Key</h3>
                    <div class="table-container">
                        <table id="keysTable">
                            <thead>
                                <tr><th>Key</th><th>Device Used</th><th>Sisa Hari</th><th>Status</th><th>Aksi</th></tr>
                            </thead>
                            <tbody id="keysTableBody"><tr><td colspan="5"><div class="loading"></div> Loading...</td></tr></tbody>
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
                        <p style="color: #667eea; margin-top: 15px;">🎉 Data tersimpan di cloud, tidak akan hilang!</p>
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
    
    <div class="api-status" id="apiStatus">☁️ Connecting to Cloud...</div>
    
    <script>
        // ========== 🔴 GANTI DENGAN CREDENTIAL SUPABASE ANDA 🔴 ==========
        const SUPABASE_URL = 'https://awikwxarhdklwvfhhglh.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_fGcIM1WXdT8o1LBZfiAqow_W4ylCyvr'; // Ganti dengan anon key Anda!
        // =================================================================
        
        let keysData = {};
        
        async function loadData() {
            try {
                document.getElementById('keysTableBody').innerHTML = '<tr><td colspan="5"><div class="loading"></div> Loading...</td></tr>';
                
                const response = await fetch(`${SUPABASE_URL}/rest/v1/keys?select=*`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (!response.ok) throw new Error('Gagal load data');
                
                const data = await response.json();
                keysData = {};
                
                data.forEach(row => {
                    keysData[row.key] = {
                        key: row.key,
                        activeDays: row.active_days,
                        maxDevices: row.max_devices,
                        firstUsed: row.first_used,
                        devices: row.devices || {},
                        createdAt: row.created_at
                    };
                });
                
                renderDashboard();
                document.getElementById('apiStatus').innerHTML = '☁️ Cloud Active ✅';
                document.getElementById('apiStatus').style.color = '#0f0';
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('apiStatus').innerHTML = '❌ Connection Failed';
                document.getElementById('apiStatus').style.color = '#f00';
                showMessage('Gagal konek ke database: ' + error.message, 'error', 'generateMessage');
            }
        }
        
        async function saveToSupabase(key, data) {
            const exists = keysData[key];
            
            if (!exists) {
                // INSERT key baru
                const response = await fetch(`${SUPABASE_URL}/rest/v1/keys`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        key: key,
                        active_days: data.activeDays,
                        max_devices: data.maxDevices,
                        first_used: data.firstUsed,
                        devices: data.devices,
                        created_at: data.createdAt
                    })
                });
                
                if (!response.ok) throw new Error('Gagal save key');
                
            } else {
                // UPDATE key yang sudah ada
                const response = await fetch(`${SUPABASE_URL}/rest/v1/keys?key=eq.${encodeURIComponent(key)}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        active_days: data.activeDays,
                        max_devices: data.maxDevices,
                        first_used: data.firstUsed,
                        devices: data.devices
                    })
                });
                
                if (!response.ok) throw new Error('Gagal update key');
            }
            
            await loadData(); // Refresh data
        }
        
        async function deleteFromSupabase(key) {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/keys?key=eq.${encodeURIComponent(key)}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (!response.ok) throw new Error('Gagal delete key');
            await loadData();
        }
        
        function generateKey() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
            return `ONIUM-RACE-${result}`;
        }
        
        function getRemainingDays(keyData) {
            if (!keyData.firstUsed) return keyData.activeDays;
            const diffDays = Math.floor((new Date() - new Date(keyData.firstUsed)) / (1000 * 60 * 60 * 24));
            const remaining = keyData.activeDays - diffDays;
            return remaining < 0 ? 0 : remaining;
        }
        
        function getKeyStatus(keyData) {
            if (!keyData.firstUsed) return 'Belum Aktif';
            return getRemainingDays(keyData) <= 0 ? 'Expired' : 'Aktif';
        }
        
        function renderDashboard() {
            const tbody = document.getElementById('keysTableBody');
            const totalKeys = Object.keys(keysData).length;
            let activeKeys = 0, expiredKeys = 0;
            
            if (totalKeys === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Belum ada key</td></tr>';
            } else {
                tbody.innerHTML = '';
                for (const [key, data] of Object.entries(keysData)) {
                    const status = getKeyStatus(data);
                    if (status === 'Aktif') activeKeys++;
                    if (status === 'Expired') expiredKeys++;
                    
                    const statusClass = status === 'Aktif' ? 'status-active' : (status === 'Expired' ? 'status-expired' : 'status-inactive');
                    const usedDevices = data.devices ? Object.keys(data.devices).length : 0;
                    
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${key}</strong></td>
                            <td>${usedDevices}/${data.maxDevices}</td>
                            <td>${getRemainingDays(data)}</td>
                            <td><span class="status-badge ${statusClass}">${status}</span></td>
                            <td>
                                <button class="reset-device-btn" onclick="resetDevice('${key}')">Reset Device</button>
                                <button class="delete-btn" onclick="deleteKey('${key}')">Hapus</button>
                            </td>
                        </tr>
                    `;
                }
            }
            document.getElementById('totalKeys').textContent = totalKeys;
            document.getElementById('activeKeys').textContent = activeKeys;
            document.getElementById('expiredKeys').textContent = expiredKeys;
        }
        
        async function resetDevice(key) {
            if (confirm(`Reset device untuk key ${key}?`)) {
                if (keysData[key]) {
                    keysData[key].devices = {};
                    keysData[key].firstUsed = null;
                    await saveToSupabase(key, keysData[key]);
                    showMessage('Device berhasil direset!', 'success', 'resetMessage');
                }
            }
        }
        
        async function deleteKey(key) {
            if (confirm(`Hapus key ${key}?`)) {
                await deleteFromSupabase(key);
                showMessage('Key berhasil dihapus', 'success', 'generateMessage');
            }
        }
        
        document.getElementById('generateKeyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const activeDays = parseInt(document.getElementById('activeDays').value);
            const maxDevices = parseInt(document.getElementById('maxDevices').value);
            
            if (activeDays <= 0 || maxDevices <= 0) {
                showMessage('Nilai tidak valid', 'error', 'generateMessage');
                return;
            }
            
            let newKey = generateKey();
            while (keysData[newKey]) newKey = generateKey();
            
            const keyData = {
                key: newKey,
                activeDays: activeDays,
                maxDevices: maxDevices,
                firstUsed: null,
                devices: {},
                createdAt: new Date().toISOString()
            };
            
            try {
                await saveToSupabase(newKey, keyData);
                
                document.getElementById('generatedKey').textContent = newKey;
                document.getElementById('resultDays').textContent = activeDays;
                document.getElementById('resultDevices').textContent = maxDevices;
                document.getElementById('keyResult').classList.add('show');
                document.getElementById('activeDays').value = '';
                document.getElementById('maxDevices').value = '';
                
                setTimeout(() => document.getElementById('keyResult').classList.remove('show'), 5000);
                showMessage('Key berhasil dibuat dan tersimpan di cloud!', 'success', 'generateMessage');
                
            } catch (error) {
                showMessage('Gagal menyimpan key: ' + error.message, 'error', 'generateMessage');
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', async () => {
            const key = document.getElementById('resetKeyInput').value.trim();
            if (!key) { showMessage('Masukkan key', 'error', 'resetMessage'); return; }
            if (!keysData[key]) { showMessage('Key tidak ditemukan', 'error', 'resetMessage'); return; }
            if (confirm(`Reset device untuk key ${key}?`)) {
                keysData[key].devices = {};
                keysData[key].firstUsed = null;
                await saveToSupabase(key, keysData[key]);
                showMessage('Key berhasil direset!', 'success', 'resetMessage');
                document.getElementById('resetKeyInput').value = '';
            }
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
                if (page === 'dashboard') renderDashboard();
            });
        });
        
        // API untuk Lua executor
        window.OniumAPI = {
            validateKey: async function(key, deviceId, deviceName) {
                await loadData(); // Refresh data terbaru
                const keyData = keysData[key];
                
                if (!keyData) return { success: false, valid: false, error: 'Key tidak valid' };
                
                if (keyData.firstUsed) {
                    const remaining = getRemainingDays(keyData);
                    if (remaining <= 0) return { success: false, valid: false, error: 'Key expired' };
                }
                
                const currentDevices = Object.keys(keyData.devices).length;
                
                if (keyData.devices[deviceId]) {
                    return { success: true, valid: true, remainingDays: getRemainingDays(keyData) };
                }
                
                if (currentDevices >= keyData.maxDevices) {
                    return { success: false, valid: false, needReset: true, error: 'Batas device tercapai' };
                }
                
                if (!keyData.firstUsed) keyData.firstUsed = new Date().toISOString();
                keyData.devices[deviceId] = { deviceId, deviceName: deviceName || 'Unknown', usedAt: new Date().toISOString() };
                
                await saveToSupabase(key, keyData);
                return { success: true, valid: true, remainingDays: getRemainingDays(keyData) };
            },
            
            getAllKeys: async function() {
                await loadData();
                return keysData;
            }
        };
        
        // Start app
        loadData();
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) renderDashboard();
        }, 5000);
    </script>
</body>
</html>
