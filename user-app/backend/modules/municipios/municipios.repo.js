// backend/src/modules/municipios/municipios.repo.js
const db = require('../../src/db');

async function listAll() {
  const [rows] = await db.query(
    'SELECT id, nombre, id_departamento FROM TC_MUNICIPIOS ORDER BY nombre ASC'
  );
  return rows;
}

async function listByDepartamento(id_departamento) {
  const [rows] = await db.query(
    'SELECT id, nombre, id_departamento FROM TC_MUNICIPIOS WHERE id_departamento = ? ORDER BY nombre ASC',
    [id_departamento]
  );
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, id_departamento FROM TC_MUNICIPIOS WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function searchByNombre(q) {
  const [rows] = await db.query(
    'SELECT id, nombre, id_departamento FROM TC_MUNICIPIOS WHERE nombre LIKE CONCAT("%", ?, "%") ORDER BY nombre ASC LIMIT 50',
    [q]
  );
  return rows;
}

async function create({ nombre, id_departamento }) {
  const [result] = await db.query(
    'INSERT INTO TC_MUNICIPIOS (nombre, id_departamento) VALUES (?, ?)',
    [nombre, id_departamento]
  );
  const id = result.insertId;
  return getById(id);
}

module.exports = {
  listAll,
  listByDepartamento,
  getById,
  searchByNombre,
  create,
};
