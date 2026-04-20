const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false  // AWS RDS SSL icin gerekli
  },
  max: 10,              // Maksimum 10 eszamanli baglanti
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Baglanti testi
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Veritabanina baglanilamadi:', err.message);
    return;
  }
  console.log('✅ PostgreSQL veritabanina basariyla baglanildi');
  release();
});

// Hata yakalama
pool.on('error', (err) => {
  console.error('❌ PostgreSQL havuzunda beklenmedik hata:', err);
  process.exit(-1);
});

module.exports = pool;