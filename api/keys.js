import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Hanya menerima POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { action, key, deviceId, deviceName, activeDays, maxDevices } = req.body;
    
    switch(action) {
        case 'validate':
            try {
                // Ambil data key dari database
                const { data: keyData, error } = await supabase
                    .from('keys')
                    .select('*')
                    .eq('key', key)
                    .single();
                
                if (error || !keyData) {
                    return res.json({ 
                        success: false, 
                        valid: false, 
                        error: 'Key tidak valid' 
                    });
                }
                
                // Hitung sisa hari
                const createdDate = new Date(keyData.created_at);
                const now = new Date();
                const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
                const remainingDays = Math.max(0, keyData.active_days - diffDays);
                
                // Cek expired
                if (remainingDays <= 0) {
                    return res.json({ 
                        success: false, 
                        valid: false, 
                        error: 'Key sudah expired' 
                    });
                }
                
                const devices = keyData.devices || {};
                const currentDevices = Object.keys(devices).length;
                
                // Cek device sudah terdaftar
                if (devices[deviceId]) {
                    return res.json({
                        success: true,
                        valid: true,
                        remainingDays: remainingDays,
                        activeDays: keyData.active_days,
                        maxDevices: keyData.max_devices,
                        message: 'Key valid'
                    });
                }
                
                // Cek batas device
                if (currentDevices >= keyData.max_devices) {
                    return res.json({
                        success: false,
                        valid: false,
                        needReset: true,
                        error: 'Batas device tercapai (max ' + keyData.max_devices + ' device)'
                    });
                }
                
                // Daftarkan device baru
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
                
                return res.json({
                    success: true,
                    valid: true,
                    remainingDays: remainingDays,
                    activeDays: keyData.active_days,
                    maxDevices: keyData.max_devices,
                    message: 'Device berhasil didaftarkan'
                });
                
            } catch (error) {
                console.error('Validation error:', error);
                return res.json({ 
                    success: false, 
                    valid: false, 
                    error: 'Server error: ' + error.message 
                });
            }
            
        case 'generate':
            try {
                if (!activeDays || !maxDevices) {
                    return res.json({ 
                        success: false, 
                        error: 'activeDays dan maxDevices diperlukan' 
                    });
                }
                
                const newKey = generateKey();
                
                // Cek apakah key sudah ada
                const { data: existing } = await supabase
                    .from('keys')
                    .select('key')
                    .eq('key', newKey)
                    .single();
                
                if (existing) {
                    // Jika sudah ada, generate ulang
                    return res.json({ 
                        success: false, 
                        error: 'Silakan coba lagi' 
                    });
                }
                
                // Insert key baru
                const { error: insertError } = await supabase
                    .from('keys')
                    .insert([{
                        key: newKey,
                        active_days: parseInt(activeDays),
                        max_devices: parseInt(maxDevices),
                        devices: {},
                        created_at: new Date().toISOString()
                    }]);
                
                if (insertError) throw insertError;
                
                return res.json({ 
                    success: true, 
                    key: newKey,
                    activeDays: parseInt(activeDays),
                    maxDevices: parseInt(maxDevices)
                });
                
            } catch (error) {
                return res.json({ 
                    success: false, 
                    error: error.message 
                });
            }
            
        case 'reset':
            try {
                if (!key) {
                    return res.json({ success: false, error: 'Key diperlukan' });
                }
                
                const { error: updateError } = await supabase
                    .from('keys')
                    .update({ devices: {}, created_at: new Date().toISOString() })
                    .eq('key', key);
                
                if (updateError) throw updateError;
                
                return res.json({ 
                    success: true, 
                    message: 'Key berhasil direset' 
                });
                
            } catch (error) {
                return res.json({ 
                    success: false, 
                    error: error.message 
                });
            }
            
        case 'list':
            try {
                const { data, error } = await supabase
                    .from('keys')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                return res.json({ 
                    success: true, 
                    keys: data 
                });
                
            } catch (error) {
                return res.json({ 
                    success: false, 
                    error: error.message 
                });
            }
            
        default:
            return res.status(400).json({ 
                success: false, 
                error: 'Unknown action. Available: validate, generate, reset, list' 
            });
    }
}

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ONIUM-RACE-${result}`;
}
