const db = require('../../src/db');

/** Normaliza fecha a YYYY-MM-DD */
function toYYYYMMDD(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** ========= LISTAR ========= */
exports.getEmpleados = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.primer_nombre,
        e.segundo_nombre,
        e.primer_apellido,
        e.segundo_apellido,
        e.DPI,
        e.correo_electronico AS email,
        e.puesto,
        e.salario,
        e.fecha_ingreso AS fechaIngreso,
        e.telefono,
        e.direccion,
        e.zona,
        e.colonia,
        e.id_municipio,
        CASE e.id_estado
          WHEN 1 THEN 'ACTIVO'
          WHEN 2 THEN 'INACTIVO'
          ELSE 'DESCONOCIDO'
        END AS estado
      FROM TT_EMPLEADOS e
      ORDER BY e.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('[getEmpleados]', error);
    res.status(500).json({ message: 'Error al obtener empleados', error: error.sqlMessage || error.message });
  }
};

/** ========= OBTENER POR ID ========= */
exports.getEmpleadoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.primer_nombre,
        e.segundo_nombre,
        e.primer_apellido,
        e.segundo_apellido,
        e.DPI,
        e.correo_electronico AS email,
        e.puesto,
        e.salario,
        e.fecha_ingreso AS fechaIngreso,
        e.telefono,
        e.direccion,
        e.zona,
        e.colonia,
        e.id_municipio,
        CASE e.id_estado
          WHEN 1 THEN 'ACTIVO'
          WHEN 2 THEN 'INACTIVO'
          ELSE 'DESCONOCIDO'
        END AS estado
      FROM TT_EMPLEADOS e
      WHERE e.id = ?
    `, [id]);

    const item = rows && rows[0];
    if (!item) return res.status(404).json({ message: 'Empleado no encontrado' });
    res.json(item);
  } catch (error) {
    console.error('[getEmpleadoById]', error);
    res.status(500).json({ message: 'Error al obtener empleado', error: error.sqlMessage || error.message });
  }
};

/** ========= EDITAR ========= */
exports.updateEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      DPI,
      email,
      puesto,
      salario,
      fechaIngreso,
      telefono,
      direccion,
      zona,
      colonia,
      id_municipio,
      estado
    } = req.body;

    const fecha = toYYYYMMDD(fechaIngreso) || toYYYYMMDD(new Date());

    const [result] = await db.query(
      `UPDATE TT_EMPLEADOS
       SET primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?,
           DPI=?, correo_electronico=?, puesto=?, salario=?, fecha_ingreso=?, telefono=?,
           direccion=?, zona=?, colonia=?, id_municipio=?, id_estado=?
       WHERE id=?`,
      [
        primer_nombre, (segundo_nombre ?? null), primer_apellido, (segundo_apellido ?? null),
        DPI, email, puesto, salario, fecha, (telefono ?? null),
        (direccion ?? null), (zona ?? null), (colonia ?? null),
        id_municipio, estado === 'ACTIVO' ? 1 : 2, id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: 'Empleado no encontrado' });
    }

    res.json({ ok: true, message: 'Empleado actualizado correctamente' });
  } catch (error) {
    console.error('[updateEmpleado]', error);
    res.status(500).json({ ok: false, message: 'Error al actualizar empleado', error: error.sqlMessage || error.message });
  }
};

/** ========= ELIMINAR ========= */
exports.deleteEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(`DELETE FROM TT_EMPLEADOS WHERE id=?`, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, message: 'Empleado no encontrado' });
    }

    res.json({ ok: true, message: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error('[deleteEmpleado]', error);
    res.status(500).json({ ok: false, message: 'Error al eliminar empleado', error: error.sqlMessage || error.message });
  }
};

