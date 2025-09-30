// backend/modules/tareas/tareas.repo.js
const pool = require('../../src/db');

async function crearTarea(data) {
  const { titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre } = data;
  const [res] = await pool.query(
    `INSERT INTO TC_TAREAS
     (titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?, NOW(), NOW())`,
    [titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre]
  );
  const [rows] = await pool.query(`SELECT * FROM TT_TAREAS WHERE id=?`, [res.insertId]);
  return rows[0];
}

async function listarTareas({ fecha, asignadoA }) {
  const params = [];
  let sql = `SELECT * FROM TC_TAREAS WHERE 1=1`;
  if (fecha) { sql += ` AND fecha = ?`; params.push(fecha); }
  if (asignadoA) { sql += ` AND asignadoA = ?`; params.push(asignadoA); }
  // Ordena por prioridad (ALTA > MEDIA > BAJA), luego más recientes
  sql += ` ORDER BY FIELD(prioridad,'ALTA','MEDIA','BAJA'), id DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function actualizarEstado(id, estado) {
  await pool.query(
    `UPDATE TC_TAREAS SET estado=?, updated_at=NOW() WHERE id=?`,
    [estado, id]
  );
  const [rows] = await pool.query(`SELECT * FROM TC_TAREAS WHERE id=?`, [id]);
  return rows[0];
}

async function tableroPorDia({ fecha, asignadoA }) {
  const tareas = await listarTareas({ fecha, asignadoA });
  const col = { PENDIENTE: [], EN_PROCESO: [], COMPLETADA: [] };
  for (const t of tareas) col[t.estado]?.push(t);
  return col;
}

module.exports = { crearTarea, listarTareas, actualizarEstado, tableroPorDia };
