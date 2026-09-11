const { Pool } = require('pg');
const path = require('path');

// Load environment variables (checking root directory first, then local backend directory)
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.xvvzmnosscdiyvogfcrq:RigMind2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const isCloudPostgres = connectionString.includes('supabase') || connectionString.includes('pooler.supabase.com') || connectionString.includes('sslmode=');

const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: isCloudPostgres ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
