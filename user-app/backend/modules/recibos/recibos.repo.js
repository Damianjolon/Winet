const pool = require('../../prisma/pool'); // ajusta la ruta a tu pool
const { normalizeItems, calcLinea, calcTotales } = require('./totals');

async function crearRecibo({ cliente_id, serie, numero, notas, items }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const norm = normalizeItems(items);
    const tot = calcTotales(norm);

    const [hdr] = await conn.query(
      `INSERT INTO TT_RECIBO (cliente_id, fecha, serie, numero, estado,
                              subtotal, descuento_total, impuesto_total, total, notas)
       VALUES (?, NOW(), ?, ?, 'BORRADOR', ?, ?, ?, ?, ?)`,
      [cliente_id, serie, numero, tot.subtotal, tot.descuento_total, tot.impuesto_total, tot.total, notas || null]
    );
    const reciboId = hdr.insertId;

    for (const it of norm) {
      const { total } = calcTotales([it]);
      if (it.tipo_item === 'SERVICIO') {
        await conn.query(
          `INSERT INTO TT_RECIBO_SERVICIOS
           (recibo_id, servicio_id, descripcion, cantidad, precio_unitario, descuento_pct, impuesto_pct, total_linea)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [reciboId, it.servicio_id, it.descripcion, it.cantidad, it.precio_unitario, it.descuento_pct, it.impuesto_pct, total]
        );
      } else {
        await conn.query(
          `INSERT INTO TT_RECIBO_PRODUCTOS
           (recibo_id, producto_id, descripcion, cantidad, precio_unitario, descuento_pct, impuesto_pct, total_linea)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [reciboId, it.producto_id, it.descripcion, it.cantidad, it.precio_unitario, it.descuento_pct, it.impuesto_pct, total]
        );
        // actualizar stock (salida)
        await conn.query(
          `UPDATE TC_PRODUCTOS SET stock_actual = stock_actual - ? WHERE id = ?`,
          [it.cantidad, it.producto_id]
        );
      }
    }

    await conn.query(`UPDATE TT_RECIBO SET estado = 'EMITIDO' WHERE id = ?`, [reciboId]);
    await conn.commit();
    return { id: reciboId, ...tot };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getRecibo(id) {
  const [[hdr]] = await pool.query(`SELECT * FROM TT_RECIBO WHERE id=?`, [id]);
  if (!hdr) return null;
  const [servs] = await pool.query(
    `SELECT id, 'SERVICIO' AS tipo_item, servicio_id, NULL AS producto_id, descripcion, cantidad, precio_unitario, descuento_pct, impuesto_pct, total_linea
       FROM TT_RECIBO_SERVICIOS WHERE recibo_id=?`, [id]);
  const [prods] = await pool.query(
    `SELECT id, 'PRODUCTO' AS tipo_item, NULL AS servicio_id, producto_id, descripcion, cantidad, precio_unitario, descuento_pct, impuesto_pct, total_linea
       FROM TT_RECIBO_PRODUCTOS WHERE recibo_id=?`, [id]);
  return { ...hdr, items: [...servs, ...prods] };
}

module.exports = { crearRecibo, getRecibo };
