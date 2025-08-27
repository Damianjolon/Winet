const db = require('../database');

exports.crearInventario = async (req, res) => {
  try {
    const {
      codigo, nombre, descripcion, precio, stock, id_categoria, id_estado
    } = req.body;

    const [rows] = await db.query(
      'CALL sp_createInventario(?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion, precio, stock, id_categoria, id_estado]
    );

    const nuevoId = rows?.[0]?.[0]?.nuevo_producto_id ?? null;
    res.status(201).json({ mensaje: 'Producto creado', id: nuevoId });
  } catch (e) {
    console.error('crearInventario error:', e);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

exports.obtenerInventario = async (_req, res) => {
  try {
    const [rows] = await db.query('CALL sp_getInventario()');
    res.json(rows[0] || []);
  } catch (e) {
    console.error('obtenerInventario error:', e);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};
