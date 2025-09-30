const pool = require('../../prisma/pool');

/**
 * Registra un movimiento de inventario (ENTRADA/SALIDA) y actualiza TC_PRODUCTOS.
 * - ENTRADA: recalcula costo_promedio (promedio ponderado)
 * - SALIDA : valida stock (no permite negativo, salvo override explícito)
 */
async function registrarMovimiento({
  producto_id,
  tipo,                   // 'ENTRADA' | 'SALIDA'
  cantidad,               // DECIMAL(14,3)
  costo_unitario,         // DECIMAL(12,2) (obligatorio en ENTRADA; en SALIDA se usa costo_promedio actual si no viene)
  doc_tipo = 'AJUSTE',
  doc_id = null,
  observacion = null,
  permitirNegativo = false
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[p]] = await conn.query(
      `SELECT id, stock_actual, costo_promedio, stock_minimo FROM TC_PRODUCTOS WHERE id=? FOR UPDATE`,
      [producto_id]
    );
    if (!p) throw new Error('Producto no encontrado');

    const cant = Number(cantidad);
    const costo = costo_unitario != null ? Number(costo_unitario) : Number(p.costo_promedio || 0);

    let newStock = Number(p.stock_actual);
    let newCostoProm = Number(p.costo_promedio || 0);

    if (tipo === 'ENTRADA') {
      // promedio ponderado
      const totalValor = newStock * newCostoProm + cant * costo;
      const totalUnid  = newStock + cant;
      newCostoProm = totalUnid > 0 ? +(totalValor / totalUnid).toFixed(2) : newCostoProm;
      newStock = +(newStock + cant).toFixed(3);
    } else if (tipo === 'SALIDA') {
      if (!permitirNegativo && newStock < cant) {
        throw Object.assign(new Error('Stock insuficiente'), { code: 'STOCK_INSUFICIENTE' });
      }
      newStock = +(newStock - cant).toFixed(3);
    } else {
      throw new Error('Tipo de movimiento inválido');
    }

    // Insertar en KÁRDEX
    await conn.query(
      `INSERT INTO TT_KARDEX_MOV (producto_id, tipo, doc_tipo, doc_id, cantidad, costo_unitario, observacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [producto_id, tipo, doc_tipo, doc_id, cant, costo, observacion]
    );

    // Actualizar producto
    await conn.query(
      `UPDATE TC_PRODUCTOS SET stock_actual=?, costo_promedio=? WHERE id=?`,
      [newStock, newCostoProm, producto_id]
    );

    await conn.commit();
    return {
      producto_id,
      tipo,
      cantidad: cant,
      costo_unitario: costo,
      stock_nuevo: newStock,
      costo_promedio_nuevo: newCostoProm,
      alerta: newStock <= Number(p.stock_minimo)
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Kárdex por producto (opcionalmente entre fechas) con saldo acumulado */
async function kardexProducto(producto_id, { desde = null, hasta = null } = {}) {
  const params = [producto_id];
  let filtroFecha = '';
  if (desde) { filtroFecha += ' AND fecha >= ?'; params.push(desde + ' 00:00:00'); }
  if (hasta) { filtroFecha += ' AND fecha <= ?'; params.push(hasta + ' 23:59:59'); }

  const [movs] = await pool.query(
    `SELECT id, fecha, tipo, doc_tipo, doc_id, cantidad, costo_unitario
       FROM TT_KARDEX_MOV
      WHERE producto_id = ? ${filtroFecha}
      ORDER BY fecha ASC, id ASC`,
    params
  );

  // saldo acumulado en Node para compatibilidad con MySQL/MariaDB
  const [[p]] = await pool.query(`SELECT stock_actual, stock_minimo FROM TC_PRODUCTOS WHERE id=?`, [producto_id]);
  let saldo = 0;
  const enriched = movs.map(m => {
    const delta = m.tipo === 'ENTRADA' ? +m.cantidad : -m.cantidad;
    saldo = +(saldo + delta).toFixed(3);
    return { ...m, saldo };
  });
  return { producto_id, stock_actual: p?.stock_actual ?? null, stock_minimo: p?.stock_minimo ?? null, movimientos: enriched };
}

/** Lista de productos con bandera de alerta */
async function productosConAlerta() {
  const [rows] = await pool.query(
    `SELECT id, sku, nombre, stock_actual, stock_minimo,
            (stock_actual <= stock_minimo) AS alerta,
            GREATEST(stock_minimo - stock_actual, 0) AS faltante
       FROM TC_PRODUCTOS
      WHERE activo = 1
        AND stock_minimo > 0
        AND stock_actual <= stock_minimo
      ORDER BY (stock_minimo - stock_actual) DESC, nombre ASC`
  );
  return rows;
}

/** Actualizar el stock_minimo (punto de reorden) */
async function setStockMinimo(producto_id, stock_minimo) {
  await pool.query(`UPDATE TC_PRODUCTOS SET stock_minimo=? WHERE id=?`, [Number(stock_minimo), Number(producto_id)]);
  const [[p]] = await pool.query(`SELECT id, sku, nombre, stock_actual, stock_minimo FROM TC_PRODUCTOS WHERE id=?`, [producto_id]);
  return p;
}

module.exports = {
  registrarMovimiento,
  kardexProducto,
  productosConAlerta,
  setStockMinimo
};
