const db = require('../../src/db');


exports.getKardex = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT mk.*, p.nombre AS producto
      FROM TC_MOVIMIENTOS_KARDEX mk
      JOIN TC_PRODUCTOS p ON p.id = mk.producto_id
      ORDER BY mk.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


exports.addMovimiento = async (req, res, next) => {
  const { producto_id, tipo, cantidad, referencia, cliente_id } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      INSERT INTO TC_MOVIMIENTOS_KARDEX
      (producto_id, tipo, cantidad, referencia, cliente_id, fecha)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [producto_id, tipo, cantidad, referencia || null, cliente_id || null]);

    const signo = tipo === 'ENTRADA' ? '+' : '-';
    await conn.query(`
      UPDATE TC_PRODUCTOS
      SET stock_actual = stock_actual ${signo} ?
      WHERE id = ?
    `, [cantidad, producto_id]);

    await conn.commit();
    res.json({ ok: true, mensaje: 'Movimiento registrado correctamente' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};


exports.alertasStock = async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nombre, stock_actual, stock_minimo,
        CASE
          WHEN stock_actual <= stock_minimo THEN 'BAJO'
          ELSE 'OK'
        END AS estado_stock
      FROM TC_PRODUCTOS
      ORDER BY stock_actual ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


exports.dashboard = async (_req, res, next) => {
  try {
    const [totalProductos] = await db.query(`SELECT COUNT(*) AS total FROM TC_PRODUCTOS`);
    const [totalEntradas]  = await db.query(`SELECT COUNT(*) AS total FROM TC_MOVIMIENTOS_KARDEX WHERE tipo='ENTRADA'`);
    const [totalSalidas]   = await db.query(`SELECT COUNT(*) AS total FROM TC_MOVIMIENTOS_KARDEX WHERE tipo='SALIDA'`);
    const [bajos]          = await db.query(`SELECT COUNT(*) AS total FROM TC_PRODUCTOS WHERE stock_actual <= stock_minimo`);

    res.json({
      total_productos: totalProductos[0].total,
      total_entradas: totalEntradas[0].total,
      total_salidas: totalSalidas[0].total,
      productos_bajos: bajos[0].total
    });
  } catch (err) {
    next(err);
  }
};


exports.getProductos = async (_req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT id, nombre, stock_actual, stock_minimo FROM TC_PRODUCTOS`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


exports.getClientes = async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        CONCAT_WS(' ', primer_nombre, segundo_nombre, primer_apellido, segundo_apellido) AS nombre
      FROM TT_CLIENTES
      ORDER BY primer_nombre ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[Error en getClientes]', err);
    next(err);
  }
};

// EDITAR MOVIMIENTO
exports.actualizarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { producto_id, tipo, cantidad, referencia, cliente_id } = req.body;

    const sql = `
      UPDATE TC_MOVIMIENTOS_KARDEX
      SET producto_id = ?, tipo = ?, cantidad = ?, referencia = ?, cliente_id = ?
      WHERE id_movimiento = ?
    `;
    await pool.query(sql, [producto_id, tipo, cantidad, referencia, cliente_id || null, id]);

    res.json({ ok: true, mensaje: 'Movimiento actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar movimiento' });
  }
};

// ELIMINAR MOVIMIENTO
exports.eliminarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM TC_MOVIMIENTOS_KARDEX WHERE id_movimiento = ?', [id]);
    res.json({ ok: true, mensaje: 'Movimiento eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar movimiento' });
  }
};

