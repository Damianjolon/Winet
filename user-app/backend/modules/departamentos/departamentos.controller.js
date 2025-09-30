// backend/src/modules/departamentos/departamentos.controller.js
const repo = require('./departamentos.repo');

async function listar(req, res) {
  try {
    const rows = await repo.listAll();
    res.json(rows);
  } catch (err) {
    console.error('[departamentos][listar]', err);
    res.status(500).json({ error: 'No se pudieron obtener los departamentos' });
  }
}

module.exports = { listar };
