// backend/modules/recibos/recibos.repo.js
const db = require('../../src/db');
const { calcLinea, normalize, calcTotales } = require('./totals');

/* ===================== CREAR ===================== */

async function crearRecibo({ id_cliente, numero, notas, items }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Cliente válido
    const [[cli]] = await conn.query(
      'SELECT id FROM TT_CLIENTES WHERE id=? LIMIT 1',
      [id_cliente]
    );
    if (!cli) { const e = new Error('El cliente no existe'); e.status = 400; throw e; }

    // Número no repetido (pre-check)
    const [[dup]] = await conn.query(
      'SELECT id FROM TT_RECIBOS WHERE numero=? LIMIT 1',
      [numero]
    );
    if (dup) { const e = new Error(`Número de recibo ${numero} ya existe`); e.status = 409; throw e; }

    // Normalizar + validar servicios
    const norm = normalize(items || []);
    const ids = [...new Set(norm.map(i => Number(i.servicio_id)))];
    if (ids.length) {
      const [okServs] = await conn.query(
        `SELECT id FROM TC_SERVICIOS WHERE activo=1 AND id IN (${ids.map(()=>'?').join(',')})`,
        ids
      );
      if (okServs.length !== ids.length) {
        const ok = new Set(okServs.map(s => s.id));
        const faltantes = ids.filter(id => !ok.has(id));
        const e = new Error(`Servicios inválidos o inactivos: ${faltantes.join(', ')}`); e.status = 400; throw e;
      }
    }

    const tot = calcTotales(norm);

    // Encabezado
    const [hdr] = await conn.query(
      `INSERT INTO TT_RECIBOS
        (id_cliente, fecha, id_estado, numero, subtotal, estado,
         descuento_total, impuesto_total, total, notas)
       VALUES (?, NOW(), 2, ?, ?, 'EMITIDO', ?, ?, ?, ?)`,
      [id_cliente, numero, tot.subtotal, tot.descuento_total, tot.impuesto_total, tot.total, notas || null]
    );
    const reciboId = hdr.insertId;

    // Detalle
    for (let i = 0; i < norm.length; i++) {
      const it = norm[i];
      const L  = calcLinea(it.cantidad, it.precio_unitario, it.descuento_pct, it.impuesto_pct);
      await conn.query(
        `INSERT INTO TT_RECIBO_SERVICIOS
           (recibo_id, servicio_id, linea, descripcion, cantidad,
            precio_unitario, descuento_pct, impuesto_pct, total_linea)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reciboId, it.servicio_id, i + 1, it.descripcion, it.cantidad,
         it.precio_unitario, it.descuento_pct, it.impuesto_pct, L.tot]
      );
    }

    await conn.commit();

    const [[row]] = await db.query(
      `SELECT id, id_cliente, fecha, id_estado, numero, subtotal, estado,
              descuento_total, impuesto_total, total, notas
         FROM TT_RECIBOS
        WHERE id = ?`,
      [reciboId]
    );
    return row;

  } catch (e) {
    await conn.rollback();
    if (e && e.code === 'ER_DUP_ENTRY') {
      e.status = 409;
      e.message = `Número de recibo ${numero} ya existe`;
    }
    if (e && e.code === 'ER_NO_REFERENCED_ROW_2') {
      e.status = 400;
      e.message = 'Referencia inválida (cliente o servicio no existe)';
    }
    throw e;
  } finally {
    conn.release();
  }
}

/* ===================== LISTAR / OBTENER ===================== */

function mapHeader(r){
  return {
    id: r.id,
    id_cliente: r.id_cliente,
    fecha: r.fecha ? r.fecha.toISOString?.().slice(0,10) || r.fecha : null,
    id_estado: r.id_estado,
    numero: r.numero,
    subtotal: Number(r.subtotal || 0),
    estado: r.estado,
    descuento_total: Number(r.descuento_total || 0),
    impuesto_total: Number(r.impuesto_total || 0),
    total: Number(r.total || 0),
    notas: r.notas ?? null,
    // extras de UI
    cliente_nombre: r.cliente_nombre ?? null,
    cliente_email: r.cliente_email ?? null,
    cliente_telefono: r.cliente_telefono ?? null,
    items_count: r.items_count ? Number(r.items_count) : undefined,
    items_preview: r.items_preview ?? undefined,
  };
}

function mapDet(d){
  const base = Number(d.precio_unitario) * Number(d.cantidad);
  const desc = base * Number(d.descuento_pct || 0) / 100;
  const imp  = (base - desc) * Number(d.impuesto_pct || 0) / 100;
  return {
    id: d.id ?? null,
    servicio_id: d.servicio_id,
    descripcion: d.descripcion,
    cantidad: Number(d.cantidad),
    precio_unitario: Number(d.precio_unitario),
    descuento_pct: Number(d.descuento_pct || 0),
    impuesto_pct: Number(d.impuesto_pct || 0),
    total_linea: base - desc + imp,
  };
}

/** Listado con nombre de cliente y resumen de items */
async function listarRecibos({ q, page = 1, pageSize = 20 }){
  page = Math.max(1, Number(page));
  pageSize = Math.min(100, Math.max(1, Number(pageSize)));
  const offset = (page - 1) * pageSize;

  const where = [];
  const params = { offset, pageSize };

  if (q){
    where.push(`(
      r.numero LIKE :q OR
      LOWER(CONCAT_WS(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido)) LIKE :q
    )`);
    params.q = `%${String(q).toLowerCase()}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // por si el texto de items es largo
  await db.query('SET SESSION group_concat_max_len = 8192');

  const [rows] = await db.query(
    `
    SELECT SQL_CALC_FOUND_ROWS
           r.*,
           TRIM(CONCAT_WS(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido)) AS cliente_nombre,
           c.correo AS cliente_email,
           c.\`Telefono\` AS cliente_telefono,
           COUNT(d.linea) AS items_count,
           GROUP_CONCAT(d.descripcion ORDER BY d.linea SEPARATOR ' • ') AS items_preview
      FROM TT_RECIBOS r
      LEFT JOIN TT_CLIENTES c           ON c.id = r.id_cliente
      LEFT JOIN TT_RECIBO_SERVICIOS d   ON d.recibo_id = r.id
      ${whereSql}
     GROUP BY r.id
     ORDER BY r.id DESC
     LIMIT :offset, :pageSize
    `,
    params
  );

  const [[tot]] = await db.query('SELECT FOUND_ROWS() AS total');
  return {
    items: rows.map(mapHeader),
    total: tot?.total ?? 0,
    page, pageSize,
  };
}

/** Header + items (para preview/detalle) */
async function obtenerReciboConItems(id){
  const [[h]] = await db.query(
    `
    SELECT r.*,
           TRIM(CONCAT_WS(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido)) AS cliente_nombre,
           c.correo AS cliente_email,
           c.\`Telefono\` AS cliente_telefono
      FROM TT_RECIBOS r
      LEFT JOIN TT_CLIENTES c ON c.id = r.id_cliente
     WHERE r.id = :id
    `,
    { id }
  );
  if (!h) return null;

  const [det] = await db.query(
    `
    SELECT d.*
      FROM TT_RECIBO_SERVICIOS d
     WHERE d.recibo_id = :id
     ORDER BY d.linea
    `,
    { id }
  );

  return { header: mapHeader(h), items: det.map(mapDet) };
}

async function obtenerRecibo(id){
  const r = await obtenerReciboConItems(id);
  if (!r) return null;
  return { ...r.header, items: r.items };
}

module.exports = {
  // crear
  crearRecibo,
  // listar / obtener
  listarRecibos,
  obtenerRecibo,
  obtenerReciboConItems,
};
