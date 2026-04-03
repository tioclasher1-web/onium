<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onium Race - Key Management System</title>
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
            text-decoration: none;
            border-radius: 10px;
            cursor: pointer;
            margin-bottom: 10px;
        }
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
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-active { background: #d4edda; color: #155724; }
        .status-expired { background: #f8d7da; color: #721c24; }
        .delete-btn, .reset-device-btn { padding: 6px 12px; margin: 0 5px; border: none; border-radius: 5px; cursor: pointer; }
        .delete-btn { background: #dc3545; color: white; }
        .reset-device-btn { background: #ffc107; color: #333; }
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
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
        }
        .message.show { display: block; }
        .message.success { background: #d4edda; color: #155724; }
        .message.error { background: #f8d7da; color: #721c24; }
        .api-status {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-family: monospace;
            color: #0f0;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>🏁 Onium Race</h2>
            <div class="nav-link active" data-page="dashboard">
                <span class="emoji">📊</span> Dashboard
            </div>
            <div class="nav-link" data-page="getkey">
                <span class="emoji">🔑</span> Get Key
            </div>
            <div class="nav-link" data-page="reset">
                <span class="emoji">🔄</span> Reset Key
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
                    <div style="overflow-x: auto;">
                        <table>
                            <thead><tr><th>Key</th><th>Device Used</th><th>Sisa Hari</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody id="keysTableBody"><tr><td colspan="5"><div class="loading"></div> Loading...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div id="getkey" class="page">
                <div class="card">
                    <h3>🎁 Get New Key</h3>
                    <div class="form-group">
                        <label>Masa Aktif (Hari)</label>
                        <input type="number" id="activeDays" required min="1" placeholder="Contoh: 30">
                    </div>
                    <div class="form-group">
                        <label>Jumlah Maksimal Device</label>
                        <input type="number" id="maxDevices" required min="1" placeholder="Contoh: 2">
                    </div>
                    <button onclick="generateNewKey()">Get Key 🚀</button>
                    
                    <div id="keyResult" class="key-result">
                        <h4>✅ Key Berhasil Dibuat!</h4>
                        <div class="key-display" id="generatedKey"></div>
                        <p><strong>Masa Aktif:</strong> <span id="resultDays"></span> hari</p>
                        <p><strong>Max Device:</strong> <span id="resultDevices"></span> device</p>
                    </div>
                    <div id="generateMessage" class="message"></div>
                </div>
            </div>
            
            <div id="reset" class="page">
                <div class="card">
                    <h3>🔄 Reset Key Device</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="resetKeyInput" placeholder="Masukkan Key" style="flex:1; padding:12px; border:2px solid #e0e0e0; border-radius:8px;">
                        <button onclick="resetKey()">Reset Device</button>
                    </div>
                    <div id="resetMessage" class="message"></div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="api-status" id="apiStatus">📁 Local Storage Mode</div>

    <script>
        // Konfigurasi Supabase
        const SUPABASE_URL = 'https://awikwxarhdklwvfhhglh.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_fGcIM1WXdT8o1LBZfiAqow_W4ylCyvr';
        
        let keysData = {};
        
        // Load data dari localStorage (biar gak ilang)
        function loadData() {
            const saved = localStorage.getItem('onium_race_keys');
            if (saved) {
                keysData = JSON.parse(saved);
            } else {
                // Data contoh
                keysData = {};
                const exampleKey = 'ONIUM-RACE-DEMO1';
                keysData[exampleKey] = {
                    key: exampleKey,
                    activeDays: 30,
                    maxDevices: 2,
                    firstUsed: new Date().toISOString(),
                    devices: { 'device123': { deviceId: 'device123', deviceName: 'Demo Device', usedAt: new Date().toISOString() } },
                    createdAt: new Date().toISOString()
                };
                saveData();
            }
            renderDashboard();
            document.getElementById('apiStatus').innerHTML = '💾 Data tersimpan di Local Storage (tidak akan hilang)';
            document.getElementById('apiStatus').style.color = '#0f0';
        }
        
        function saveData() {
            localStorage.setItem('onium_race_keys', JSON.stringify(keysData));
            renderDashboard();
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
        
        function generateNewKey() {
            const activeDays = parseInt(document.getElementById('activeDays').value);
            const maxDevices = parseInt(document.getElementById('maxDevices').value);
            
            if (activeDays <= 0 || maxDevices <= 0) {
                showMessage('Nilai tidak valid', 'error', 'generateMessage');
                return;
            }
            
            let newKey = generateKey();
            while (keysData[newKey]) newKey = generateKey();
            
            keysData[newKey] = {
                key: newKey,
                activeDays: activeDays,
                maxDevices: maxDevices,
                firstUsed: null,
                devices: {},
                createdAt: new Date().toISOString()
            };
            saveData();
            
            document.getElementById('generatedKey').textContent = newKey;
            document.getElementById('resultDays').textContent = activeDays;
            document.getElementById('resultDevices').textContent = maxDevices;
            document.getElementById('keyResult').classList.add('show');
            document.getElementById('activeDays').value = '';
            document.getElementById('maxDevices').value = '';
            
            setTimeout(() => document.getElementById('keyResult').classList.remove('show'), 5000);
            showMessage('Key berhasil dibuat! Data tersimpan di Local Storage.', 'success', 'generateMessage');
        }
        
        function resetKey() {
            const key = document.getElementById('resetKeyInput').value.trim();
            if (!key) { showMessage('Masukkan key', 'error', 'resetMessage'); return; }
            if (!keysData[key]) { showMessage('Key tidak ditemukan', 'error', 'resetMessage'); return; }
            if (confirm(`Reset device untuk key ${key}?`)) {
                keysData[key].devices = {};
                keysData[key].firstUsed = null;
                saveData();
                showMessage('Key berhasil direset!', 'success', 'resetMessage');
                document.getElementById('resetKeyInput').value = '';
            }
        }
        
        function resetDevice(key) {
            if (confirm(`Reset device untuk key ${key}?`)) {
                if (keysData[key]) {
                    keysData[key].devices = {};
                    keysData[key].firstUsed = null;
                    saveData();
                    showMessage('Device berhasil direset!', 'success', 'resetMessage');
                }
            }
        }
        
        function deleteKey(key) {
            if (confirm(`Hapus key ${key}?`)) {
                delete keysData[key];
                saveData();
                showMessage('Key berhasil dihapus', 'success', 'generateMessage');
            }
        }
        
        function showMessage(message, type, elementId) {
            const msgDiv = document.getElementById(elementId);
            msgDiv.textContent = message;
            msgDiv.className = `message ${type} show`;
            setTimeout(() => msgDiv.classList.remove('show'), 3000);
        }
        
        // Navigasi
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
        loadData();
        
        // Auto refresh
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) {
                renderDashboard();
            }
        }, 5000);
        
        console.log('✅ System siap digunakan! Data tersimpan di Local Storage browser.');
        console.log('📌 Key yang sudah dibuat tidak akan hilang sampai cache browser dihapus.');
    </script>
</body>
</html>
