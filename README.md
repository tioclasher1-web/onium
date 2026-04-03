# Onium Race Key Management System

Sistem manajemen key untuk game Onium Race dengan database Supabase.

## Setup Supabase

1. Buat akun di https://supabase.com
2. Create new project
3. Jalankan SQL berikut di SQL Editor:

```sql
CREATE TABLE keys (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    active_days INTEGER NOT NULL,
    max_devices INTEGER NOT NULL,
    devices JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keys_key ON keys(key);
CREATE INDEX idx_keys_created_at ON keys(created_at);
