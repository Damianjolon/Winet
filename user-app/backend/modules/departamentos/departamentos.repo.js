// backend/src/modules/departamentos/departamentos.repo.js
const db = require('../../src/db');

async function listAll() {
  const [rows] = await db.query(
    'SELECT id, nombre FROM TC_DEPARTAMENTOS ORDER BY nombre ASC'
  );
  return rows;
}

module.exports = { listAll };
