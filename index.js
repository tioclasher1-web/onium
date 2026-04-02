<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onium Race - Key Management System</title>
    <link rel="icon" type="image/png" sizes="32x32" href="https://files.catbox.moe/bjwzg5.png">
<link rel="shortcut icon" href="https://files.catbox.moe/bjwzg5.png">
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
        
        .modal.show {
            display: flex;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
        }
        
        .modal-buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .btn-cancel {
            background: #6c757d;
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
        
        /* API Status Indicator */
        .api-status {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            color: #0f0;
            font-family: monospace;
            z-index: 1000;
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
                            <tbody id="keysTableBody"><tr><td colspan="5">Loading...</td></tr></tbody>
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
                        <input type="text" id="resetKeyInput" placeholder="Masukkan Key" style="flex:1; padding:12px; border:2px solid #e0e0e0; border-radius:8px;">
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
            <div class="modal-buttons">
                <button id="confirmYes" style="background:#dc3545;">Yes</button>
                <button id="confirmNo" class="btn-cancel">No</button>
            </div>
        </div>
    </div>
    
    <div class="api-status" id="apiStatus">🌐 API Ready</div>
    
    <script>
        // ========== DATA STORAGE ==========
        let keysData = {};
        
        function loadData() {
            const saved = localStorage.getItem('onium_race_keys');
            if (saved) {
                keysData = JSON.parse(saved);
            } else {
                keysData = {};
                const exampleKey = 'ONIUM-RACE-DEMO1';
                keysData[exampleKey] = {
                    key: exampleKey, activeDays: 30, maxDevices: 2,
                    firstUsed: new Date().toISOString(),
                    devices: { 'device123': { deviceId: 'device123', deviceName: 'Demo Device', usedAt: new Date().toISOString() } },
                    createdAt: new Date().toISOString()
                };
                saveData();
            }
            renderDashboard();
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
                    
                    tbody.innerHTML += `<tr>
                        <td><strong>${key}</strong></td>
                        <td>${usedDevices}/${data.maxDevices}</td>
                        <td>${getRemainingDays(data)}</td>
                        <td><span class="status-badge ${statusClass}">${status}</span></td>
                        <td>
                            <button class="reset-device-btn" onclick="resetDevice('${key}')">Reset Device</button>
                            <button class="delete-btn" onclick="deleteKey('${key}')">Hapus</button>
                        </td>
                    </tr>`;
                }
            }
            document.getElementById('totalKeys').textContent = totalKeys;
            document.getElementById('activeKeys').textContent = activeKeys;
            document.getElementById('expiredKeys').textContent = expiredKeys;
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
                showMessage('Key berhasil dihapus', 'success');
            }
        }
        
        document.getElementById('generateKeyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const activeDays = parseInt(document.getElementById('activeDays').value);
            const maxDevices = parseInt(document.getElementById('maxDevices').value);
            
            if (activeDays <= 0 || maxDevices <= 0) {
                showMessage('Nilai tidak valid', 'error', 'generateMessage');
                return;
            }
            
            let newKey = generateKey();
            while (keysData[newKey]) newKey = generateKey();
            
            keysData[newKey] = {
                key: newKey, activeDays, maxDevices, firstUsed: null, devices: {}, createdAt: new Date().toISOString()
            };
            saveData();
            
            document.getElementById('generatedKey').textContent = newKey;
            document.getElementById('resultDays').textContent = activeDays;
            document.getElementById('resultDevices').textContent = maxDevices;
            document.getElementById('keyResult').classList.add('show');
            document.getElementById('activeDays').value = '';
            document.getElementById('maxDevices').value = '';
            setTimeout(() => document.getElementById('keyResult').classList.remove('show'), 5000);
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
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
        });
        
        function showMessage(message, type, elementId) {
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
        
        // ========== API ENDPOINT HANDLER ==========
        // Ini adalah bagian PENTING untuk koneksi ke script Lua!
        // Website ini akan menangani request POST dari script Lua
        
        function handleAPIRequest(requestData) {
            const { action, key, deviceId, deviceName, activeDays, maxDevices } = requestData;
            
            // CORS headers untuk response
            const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
            
            // VALIDATE/USE KEY
            if (action === 'validate' || action === 'use') {
                if (!key || !deviceId) {
                    return { success: false, error: 'Key dan Device ID diperlukan' };
                }
                
                const keyData = keysData[key];
                if (!keyData) {
                    return { success: false, valid: false, error: 'Key tidak valid' };
                }
                
                // Cek expired
                if (keyData.firstUsed) {
                    const remaining = getRemainingDays(keyData);
                    if (remaining <= 0) {
                        return { success: false, valid: false, error: 'Key sudah expired' };
                    }
                }
                
                const currentDevices = Object.keys(keyData.devices).length;
                
                // Device sudah terdaftar
                if (keyData.devices[deviceId]) {
                    return {
                        success: true, valid: true,
                        remainingDays: getRemainingDays(keyData),
                        activeDays: keyData.activeDays,
                        maxDevices: keyData.maxDevices,
                        message: 'Key valid'
                    };
                }
                
                // Cek slot device
                if (currentDevices >= keyData.maxDevices) {
                    return {
                        success: false, valid: false, needReset: true,
                        error: 'Batas device tercapai, perlu reset dari website'
                    };
                }
                
                // First time use
                if (!keyData.firstUsed) {
                    keyData.firstUsed = new Date().toISOString();
                }
                
                // Register device
                keyData.devices[deviceId] = {
                    deviceId: deviceId,
                    deviceName: deviceName || 'Unknown',
                    usedAt: new Date().toISOString()
                };
                
                saveData();
                
                return {
                    success: true, valid: true,
                    remainingDays: getRemainingDays(keyData),
                    activeDays: keyData.activeDays,
                    maxDevices: keyData.maxDevices,
                    message: 'Key berhasil diaktifkan'
                };
            }
            
            // GET ALL KEYS
            if (action === 'list') {
                const allKeys = {};
                for (const [k, data] of Object.entries(keysData)) {
                    allKeys[k] = {
                        key: k,
                        activeDays: data.activeDays,
                        maxDevices: data.maxDevices,
                        remainingDays: getRemainingDays(data),
                        status: getKeyStatus(data),
                        usedDevices: data.devices ? Object.keys(data.devices).length : 0
                    };
                }
                return { success: true, keys: allKeys };
            }
            
            // GENERATE KEY
            if (action === 'generate') {
                if (!activeDays || !maxDevices) {
                    return { success: false, error: 'Masukkan hari dan max device' };
                }
                
                let newKey = generateKey();
                while (keysData[newKey]) newKey = generateKey();
                
                keysData[newKey] = {
                    key: newKey,
                    activeDays: parseInt(activeDays),
                    maxDevices: parseInt(maxDevices),
                    firstUsed: null,
                    devices: {},
                    createdAt: new Date().toISOString()
                };
                saveData();
                
                return {
                    success: true,
                    key: newKey,
                    activeDays: parseInt(activeDays),
                    maxDevices: parseInt(maxDevices)
                };
            }
            
            // RESET KEY
            if (action === 'reset') {
                if (!key) return { success: false, error: 'Key diperlukan' };
                if (!keysData[key]) return { success: false, error: 'Key tidak ditemukan' };
                
                keysData[key].devices = {};
                keysData[key].firstUsed = null;
                saveData();
                
                return { success: true, message: 'Key berhasil direset' };
            }
            
            return { success: false, error: 'Unknown action' };
        }
        
        // ========== LISTENER UNTUK POST MESSAGE (UNTUK IFRAME ATAU WEB VIEW) ==========
        window.addEventListener('message', function(event) {
            // Terima pesan dari iframe atau web view
            const data = event.data;
            if (data && data.type === 'ONIUM_API_REQUEST') {
                const result = handleAPIRequest(data.payload);
                // Kirim balik ke pengirim
                if (event.source) {
                    event.source.postMessage({
                        type: 'ONIUM_API_RESPONSE',
                        requestId: data.requestId,
                        result: result
                    }, '*');
                }
            }
        });
        
        // ========== EXPOSE API KE WINDOW (UNTUK AKSES LANGSUNG DARI CONSOLE/EXECUTOR) ==========
        window.OniumAPI = {
            validateKey: function(key, deviceId, deviceName) {
                const result = handleAPIRequest({ action: 'validate', key, deviceId, deviceName });
                return result;
            },
            
            getAllKeys: function() {
                return handleAPIRequest({ action: 'list' });
            },
            
            generateKey: function(activeDays, maxDevices) {
                return handleAPIRequest({ action: 'generate', activeDays, maxDevices });
            },
            
            resetKey: function(key) {
                return handleAPIRequest({ action: 'reset', key });
            }
        };
        
        // ========== SIMULASI HTTP SERVER (UNTUK REQUEST DARI EXECUTOR VIA HTTP) ==========
        // Karena ini file statis, kita tidak bisa membuat HTTP server sungguhan.
        // TAPI kita bisa menggunakan teknik polling atau WebSocket alternative.
        
        // Solusi: Gunakan server proxy atau deploy ke Vercel/Netlify dengan serverless functions
        // Atau gunakan service seperti Supabase untuk database bersama
        
        console.log('========================================');
        console.log('🏁 ONIUM RACE KEY SYSTEM');
        console.log('========================================');
        console.log('⚠️  PERINGATAN PENTING ⚠️');
        console.log('========================================');
        console.log('');
        console.log('Website ini menyimpan data di LOCAL STORAGE browser Anda.');
        console.log('');
        console.log('Untuk terhubung dengan SCRIPT LUA di Roblox executor, Anda punya 2 opsi:');
        console.log('');
        console.log('1️⃣  MENGGUNAKAN WEB VIEW (Jika executor support):');
        console.log('   - Buka halaman ini di web view executor');
        console.log('   - Panggil window.OniumAPI.validateKey(key, deviceId)');
        console.log('');
        console.log('2️⃣  MENGGUNAKAN SERVER PROXY (Rekomendasi):');
        console.log('   - Deploy server Node.js (index.js) ke Vercel/Render');
        console.log('   - Atau gunakan Supabase sebagai database online');
        console.log('');
        console.log('3️⃣  MENGGUNAKAN LOCAL STORAGE (Hanya untuk testing):');
        console.log('   - Data hanya tersimpan di browser ini');
        console.log('   - Script Lua TIDAK BISA akses langsung');
        console.log('');
        console.log('========================================');
        console.log('API Methods yang tersedia:');
        console.log('  window.OniumAPI.validateKey(key, deviceId, deviceName)');
        console.log('  window.OniumAPI.getAllKeys()');
        console.log('  window.OniumAPI.generateKey(days, devices)');
        console.log('  window.OniumAPI.resetKey(key)');
        console.log('========================================');
        
        // Update status
        document.getElementById('apiStatus').innerHTML = '⚠️ Local Storage Mode (Lua cannot access directly)';
        document.getElementById('apiStatus').style.color = '#ff0';
        
        loadData();
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) renderDashboard();
        }, 5000);
    </script>
</body>
</html>
