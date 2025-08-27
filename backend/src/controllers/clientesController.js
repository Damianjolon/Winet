const db = require('../database');

exports.crearCliente = async (req, res) => {
  try {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      correo,
      direccion,
      zona,
      colonia,
      id_municipio,
      id_estado,
      telefono
    } = req.body;

    const [resultsets] = await db.query(
      'CALL u750816565_winet.sp_createCliente(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        null, // p_id (NULL => AUTO_INCREMENT)
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        correo,
        direccion,
        zona,
        colonia,
        id_municipio,
        id_estado,
        telefono
      ]
    );

    // MySQL devuelve los SELECT del SP como un arreglo de resultsets
    const nuevoId = Array.isArray(resultsets) && resultsets[0]?.nuevo_cliente_id
      ? resultsets[0].nuevo_cliente_id
      : (resultsets?.[0]?.[0]?.nuevo_cliente_id ?? null);

    res.json({ message: 'Cliente creado correctamente', id: nuevoId });
  } catch (error) {
    console.error('crearCliente error:', error);
    res.status(500).json({ error: 'Error al crear cliente', detail: error.message });
  }
};


exports.obtenerClientes = async (_req, res) => {
  try {
    const [rows] = await db.query('CALL sp_getCliente()');
    res.json(rows[0] || []);
  } catch (e) {
    console.error('obtenerClientes error:', e);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};
