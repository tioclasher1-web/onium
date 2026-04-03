import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { action, key, deviceId, deviceName, activeDays, maxDevices } = req.body;
    
    try {
        switch(action) {
            case 'validate':
                const { data: keyData, error } = await supabase
                    .from('keys')
                    .select('*')
                    .eq('key', key)
                    .single();
                
                if (error || !keyData) {
                    return res.json({ success: false, valid: false, error: 'Key tidak valid' });
                }
                
                const createdDate = new Date(keyData.created_at);
                const now = new Date();
                const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
                const remainingDays = Math.max(0, keyData.active_days - diffDays);
                
                if (remainingDays <= 0) {
                    return res.json({ success: false, valid: false, error: 'Key expired' });
                }
                
                const devices = keyData.devices || {};
                
                if (devices[deviceId]) {
                    return res.json({
                        success: true, valid: true, remainingDays,
                        activeDays: keyData.active_days,
                        maxDevices: keyData.max_devices
                    });
                }
                
                if (Object.keys(devices).length >= keyData.max_devices) {
                    return res.json({
                        success: false, valid: false, needReset: true,
                        error: `Batas device tercapai (max ${keyData.max_devices} device)`
                    });
                }
                
                devices[deviceId] = {
                    deviceId, deviceName: deviceName || 'Unknown',
                    usedAt: new Date().toISOString()
                };
                
                await supabase.from('keys').update({ devices }).eq('key', key);
                
                return res.json({
                    success: true, valid: true, remainingDays,
                    activeDays: keyData.active_days,
                    maxDevices: keyData.max_devices
                });
                
            case 'generate':
                const newKey = 'ONIUM-RACE-' + Math.random().toString(36).substring(2, 7).toUpperCase();
                
                await supabase.from('keys').insert([{
                    key: newKey,
                    active_days: parseInt(activeDays),
                    max_devices: parseInt(maxDevices),
                    devices: {},
                    created_at: new Date().toISOString()
                }]);
                
                return res.json({ success: true, key: newKey });
                
            case 'reset':
                await supabase
                    .from('keys')
                    .update({ devices: {}, created_at: new Date().toISOString() })
                    .eq('key', key);
                
                return res.json({ success: true, message: 'Key berhasil direset' });
                
            case 'list':
                const { data: keys } = await supabase
                    .from('keys')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                return res.json({ success: true, keys });
                
            default:
                return res.status(400).json({ error: 'Action tidak dikenal' });
        }
    } catch (error) {
        return res.json({ success: false, error: error.message });
    }
}
