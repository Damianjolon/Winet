require('dotenv').config();
console.log('[ENV]', process.env.DB_HOST, process.env.DB_USER);

const mysql = require('mysql2/promise');


const pool = mysql.createPool({
  host: process.env.DB_HOST || '82.197.82.50',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  namedPlaceholders: true,
});

(async () => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS db');
    console.log('[DB] Conectado a:', rows[0]?.db);
  } catch (e) {
    console.error('[DB] Error de conexión:', e.message);
  }
})();

module.exports = pool;
