const pool = require('../../src/db');

// Cambia aquí si tu tabla real es TT_TAREAS
const TABLE = 'TC_TAREAS';

async function crearAsignacion(data) {
  const { titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre } = data;
  const [res] = await pool.query(
    `INSERT INTO ${TABLE}
     (titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?, NOW(), NOW())`,
    [titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre]
  );
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id=?`, [res.insertId]);
  return rows[0];
}

async function listarAsignaciones({ fecha, asignadoA }) {
  const params = [];
  let sql = `SELECT * FROM ${TABLE} WHERE 1=1`;
  if (fecha)     { sql += ` AND fecha = ?`; params.push(fecha); }
  if (asignadoA) { sql += ` AND asignadoA = ?`; params.push(asignadoA); }
  sql += ` ORDER BY FIELD(prioridad,'ALTA','MEDIA','BAJA'), id DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function actualizarEstado(id, estado) {
  const [r] = await pool.query(`UPDATE ${TABLE} SET estado=?, updated_at=NOW() WHERE id=?`, [estado, id]);
  if (!r.affectedRows) return null;
  const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id=?`, [id]);
  return rows[0];
}

async function tableroPorDia({ fecha, asignadoA }) {
  const tareas = await listarAsignaciones({ fecha, asignadoA });
  const col = { PENDIENTE: [], EN_PROCESO: [], COMPLETADA: [], FINALIZADA: [] }; // incluye FINALIZADA
  for (const t of tareas) if (col[t.estado]) col[t.estado].push(t);
  return col;
}

async function listarTodas({ desde, hasta, estado, asignadoA, q }) {
  const params = [];
  let sql = `
    SELECT
      t.id, t.titulo, t.descripcion, t.prioridad, t.estado, t.fecha,
      DATE_FORMAT(t.created_at, '%H:%i:%s') AS hora,
      t.created_at, t.updated_at,
      COALESCE(t.asignadoANombre,
        CONCAT_WS(' ', e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido)
      ) AS empleado
    FROM ${TABLE} t
    LEFT JOIN TT_EMPLEADOS e ON e.id = t.asignadoA
    WHERE 1=1
  `;
  if (desde)     { sql += ` AND t.fecha >= ?`; params.push(desde); }
  if (hasta)     { sql += ` AND t.fecha <= ?`; params.push(hasta); }
  if (estado)    { sql += ` AND t.estado = ?`; params.push(estado); }
  if (asignadoA) { sql += ` AND t.asignadoA = ?`; params.push(Number(asignadoA)); }
  if (q) {
    sql += ` AND (t.titulo LIKE ? OR t.descripcion LIKE ? OR t.asignadoANombre LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY t.fecha DESC, t.created_at DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function eliminarAsignacion(id) {
  const [r] = await pool.query(`DELETE FROM ${TABLE} WHERE id=?`, [id]);
  console.log('[SQL DELETE]', { id, affectedRows: r.affectedRows });
  return r.affectedRows > 0;
}

module.exports = {
  crearAsignacion,
  listarAsignaciones,
  actualizarEstado,
  tableroPorDia,
  listarTodas,
  eliminarAsignacion,
};




// const pool = require('../../src/db');

// // Usa SIEMPRE la misma tabla:
// const TABLE = 'TC_TAREAS';

// async function crearAsignacion(data) {
//   const { titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre } = data;
//   const [res] = await pool.query(
//     `INSERT INTO ${TABLE}
//      (titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre, created_at, updated_at)
//      VALUES (?,?,?,?,?,?,?, NOW(), NOW())`,
//     [titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre]
//   );
//   const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id=?`, [res.insertId]);
//   return rows[0];
// }

// async function listarAsignaciones({ fecha, asignadoA }) {
//   const params = [];
//   let sql = `SELECT * FROM ${TABLE} WHERE 1=1`;
//   if (fecha) { sql += ` AND fecha = ?`; params.push(fecha); }
//   if (asignadoA) { sql += ` AND asignadoA = ?`; params.push(asignadoA); }
//   sql += ` ORDER BY FIELD(prioridad,'ALTA','MEDIA','BAJA'), id DESC`;
//   const [rows] = await pool.query(sql, params);
//   return rows;
// }

// async function actualizarEstado(id, estado) {
//   await pool.query(`UPDATE ${TABLE} SET estado=?, updated_at=NOW() WHERE id=?`, [estado, id]);
//   const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE id=?`, [id]);
//   return rows[0];
// }

// async function tableroPorDia({ fecha, asignadoA }) {
//   const tareas = await listarAsignaciones({ fecha, asignadoA });
//   const col = { PENDIENTE: [], EN_PROCESO: [], COMPLETADA: [], FINALIZADA: [] }; // <-- incluye FINALIZADA
//   for (const t of tareas) if (col[t.estado]) col[t.estado].push(t);
//   return col;
// }

// async function listarTodas({ desde, hasta, estado, asignadoA, q }) {
//   const params = [];
//   let sql = `
//     SELECT
//       t.id,
//       t.titulo,
//       t.descripcion,
//       t.prioridad,
//       t.estado,
//       t.fecha,
//       DATE_FORMAT(t.created_at, '%H:%i:%s') AS hora,
//       t.created_at,
//       t.updated_at,
//       COALESCE(t.asignadoANombre,
//         CONCAT_WS(' ', e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido)
//       ) AS empleado
//     FROM ${TABLE} t
//     LEFT JOIN TT_EMPLEADOS e ON e.id = t.asignadoA
//     WHERE 1=1
//   `;

//   if (desde) { sql += ` AND t.fecha >= ?`; params.push(desde); }
//   if (hasta) { sql += ` AND t.fecha <= ?`; params.push(hasta); }
//   if (estado) { sql += ` AND t.estado = ?`; params.push(estado); }
//   if (asignadoA) { sql += ` AND t.asignadoA = ?`; params.push(Number(asignadoA)); }
//   if (q) {
//     sql += ` AND (t.titulo LIKE ? OR t.descripcion LIKE ? OR t.asignadoANombre LIKE ?)`;
//     params.push(`%${q}%`, `%${q}%`, `%${q}%`);
//   }

//   sql += ` ORDER BY t.fecha DESC, t.created_at DESC`;
//   const [rows] = await pool.query(sql, params);
//   return rows;
// }

// async function eliminarAsignacion(id) {
//   const [r] = await pool.query(`DELETE FROM ${TABLE} WHERE id=?`, [id]); // <-- misma tabla
//   return r.affectedRows > 0;
// }

// module.exports = {
//   crearAsignacion,
//   listarAsignaciones,
//   actualizarEstado,
//   tableroPorDia,
//   listarTodas,
//   eliminarAsignacion,
// };
