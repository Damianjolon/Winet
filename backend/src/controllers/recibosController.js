const db = require('../database');

exports.crearReciboConDetalles = async (req, res) => {
  try {
    const { id_cliente, fecha_recibo, metodo_pago, observaciones, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items debe ser un arreglo con al menos un elemento' });
    }

    const [rows] = await db.query(
      'CALL sp_createReciboConDetalles(?, ?, ?, ?, ?)',
      [id_cliente, fecha_recibo, metodo_pago, observaciones || null, JSON.stringify(items)]
    );

    const result = rows?.[0]?.[0] || null; // { nuevo_recibo_id, total }
    res.status(201).json({ mensaje: 'Recibo creado con detalles', recibo: result });
  } catch (e) {
    console.error('crearReciboConDetalles error:', e);
    res.status(500).json({ error: 'Error al crear el recibo con detalles' });
  }
};

exports.obtenerRecibos = async (_req, res) => {
  try {
    const [rows] = await db.query('CALL sp_getRecibos()');
    res.json(rows[0] || []);
  } catch (e) {
    console.error('obtenerRecibos error:', e);
    res.status(500).json({ error: 'Error al obtener recibos' });
  }
};

exports.obtenerReciboDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('CALL sp_getReciboDetalle(?)', [id]);
    res.json(rows[0] || []);
  } catch (e) {
    console.error('obtenerReciboDetalle error:', e);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
};
