// backend/src/modules/municipios/municipios.controller.js
const repo = require('./municipios.repo');

async function listar(req, res) {
  try {
    const id_departamento = req.query.id_departamento;
    const rows = id_departamento
      ? await repo.listByDepartamento(id_departamento)
      : await repo.listAll();
    res.json(rows);
  } catch (err) {
    console.error('[municipios][listar]', err);
    res.status(500).json({ error: 'No se pudieron obtener los municipios' });
  }
}

async function porDepartamento(req, res) {
  try {
    const rows = await repo.listByDepartamento(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error('[municipios][porDepartamento]', err);
    res.status(500).json({ error: 'No se pudieron obtener los municipios' });
  }
}

async function obtener(req, res) {
  try {
    const row = await repo.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    res.json(row);
  } catch (err) {
    console.error('[municipios][obtener]', err);
    res.status(500).json({ error: 'No se pudo obtener el municipio' });
  }
}

async function buscar(req, res) {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json([]);
    const rows = await repo.searchByNombre(q);
    res.json(rows);
  } catch (err) {
    console.error('[municipios][buscar]', err);
    res.status(500).json({ error: 'No se pudo buscar municipios' });
  }
}

async function crear(req, res) {
  try {
    const { nombre, id_departamento } = req.body || {};
    if (!nombre || !id_departamento)
      return res.status(400).json({ error: 'nombre e id_departamento son requeridos' });

    const row = await repo.create({ nombre, id_departamento });
    res.status(201).json(row);
  } catch (err) {
    console.error('[municipios][crear]', err);
    res.status(500).json({ error: 'No se pudo crear el municipio' });
  }
}

module.exports = {
  listar,
  porDepartamento,
  obtener,
  buscar,
  crear,
};
