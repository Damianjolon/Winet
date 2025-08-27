const db = require('../database');

exports.crearEmpleado = async (req, res) => {
  try {
    const {
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      puesto, salario, fecha_ingreso, direccion, zona, colonia,
      id_municipio, id_estado
    } = req.body;

    const [rows] = await db.query(
      'CALL sp_createEmpleado(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
       puesto, salario, fecha_ingreso, direccion, zona, colonia,
       id_municipio, id_estado]
    );

    const nuevoId = rows?.[0]?.[0]?.nuevo_empleado_id ?? null;
    res.status(201).json({ mensaje: 'Empleado creado', id: nuevoId });
  } catch (e) {
    console.error('crearEmpleado error:', e);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

exports.obtenerEmpleados = async (req, res) => {
  try {
    const [rows] = await db.query('CALL sp_getEmpleados()');
    res.json(rows[0] || []);
  } catch (e) {
    console.error('obtenerEmpleados error:', e);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};
