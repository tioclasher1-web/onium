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
    
    const { action, key, deviceId, deviceName, activeDays, maxDevices } = req.body;
    
    switch(action) {
        case 'validate':
            const keyData = await supabase.from('keys').select('*').eq('key', key).single();
            // Validation logic here
            return res.json({ success: true });
            
        case 'generate':
            const newKey = generateKey();
            // Generate logic here
            return res.json({ success: true, key: newKey });
            
        default:
            return res.status(400).json({ error: 'Unknown action' });
    }
}

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return `ONIUM-RACE-${result}`;
}
