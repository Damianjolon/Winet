const db = require('../database'); // o como tengas tu conexión

const obtenerEmpleados = async (req, res) => {
  try {
    const [rows] = await db.query('CALL sp_getEmpleados()');
    res.json(rows[0]); // Devuelve solo la parte útil del resultado
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};

module.exports = {
  crearEmpleado,
  obtenerEmpleados
};
