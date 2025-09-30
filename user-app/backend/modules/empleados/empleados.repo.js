// Usa el mismo pool que tus controladores
const db = require('../../src/db');

/**
 * Devuelve un empleado por id con nombres/apellidos y estado normalizado.
 * - Tabla: TT_EMPLEADOS
 * - Mapea id_estado: 1 -> ACTIVO, 2 -> INACTIVO, otro -> DESCONOCIDO
 */
async function obtenerEmpleadoPorId(id) {
  const [rows] = await db.query(`
    SELECT
      e.id,
      e.primer_nombre,
      e.segundo_nombre,
      e.primer_apellido,
      e.segundo_apellido,
      CASE e.id_estado
        WHEN 1 THEN 'ACTIVO'
        WHEN 2 THEN 'INACTIVO'
        ELSE 'DESCONOCIDO'
      END AS estado
    FROM TT_EMPLEADOS e
    WHERE e.id = ?
    LIMIT 1
  `, [id]);

  return rows?.[0] || null;
}

/**
 * (Opcional) Construye el nombre completo igual que en tu front.
 * Útil si alguna vez quieres formar asignadoANombre desde el back.
 */
function nombreCompleto(emp) {
  if (!emp) return '';
  const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido } = emp;
  return [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido].filter(Boolean).join(' ');
}

module.exports = { obtenerEmpleadoPorId, nombreCompleto };
