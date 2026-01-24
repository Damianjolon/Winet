// backend/modules/recibos/recibos.routes.js
const express = require('express');
const router = express.Router();

const db = require('../../src/db');
const {
  crearRecibo,
  listarRecibos,
  obtenerRecibo,
  obtenerReciboConItems,
} = require('./recibos.repo');

/* ============ UTILIDADES ============ */

/** GET /api/recibos/siguiente-numero */
router.get('/siguiente-numero', async (_req, res, next) => {
  try {
    const [[r]] = await db.query('SELECT IFNULL(MAX(numero),0)+1 AS next FROM TT_RECIBOS');
    res.json(r); // { next: 1004 }
  } catch (e) { next(e); }
});

/* ============ LISTADO / DETALLE ============ */

/** GET /api/recibos  (q?, page?, pageSize?) */
router.get('/', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { q, page, pageSize } = req.query;
    const data = await listarRecibos({ q, page, pageSize });
    res.json(data);
  } catch (e) { next(e); }
});

/** GET /api/recibos/:id  -> header + items */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'id inválido' });
    const one = await obtenerRecibo(id);
    if (!one) return res.status(404).json({ message: 'Recibo no encontrado' });
    res.json(one);
  } catch (e) { next(e); }
});

/** GET /api/recibos/:id/preview  -> HTML imprimible */
router.get('/:id/preview', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send('id inválido');

    const data = await obtenerReciboConItems(id);
    if (!data) return res.status(404).send('Recibo no encontrado');

    const { header: r, items } = data;
    const money = n => `Q ${Number(n || 0).toFixed(2)}`;
    const rows = items.map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${it.descripcion}</td>
        <td class="num">${it.cantidad}</td>
        <td class="num">${money(it.precio_unitario)}</td>
        <td class="num">${Number(it.descuento_pct || 0).toFixed(0)}%</td>
        <td class="num">${Number(it.impuesto_pct || 0).toFixed(0)}%</td>
        <td class="num">${money(it.total_linea)}</td>
      </tr>
    `).join('');

    const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Recibo #${r.numero}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box}
body{font:12px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;background:#fff;color:#0f172a}
.wrap{max-width:820px;margin:28px auto;padding:0 16px}
h1{margin:0 0 12px;font-size:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.box{border:1px solid #e5e7eb;border-radius:10px;padding:10px}
.muted{color:#64748b}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{border:1px solid #e5e7eb;padding:6px}
th{background:#f8fafc;text-align:left}
td.num,th.num{text-align:right}
.totales{margin-top:12px;display:grid;grid-template-columns:1fr 260px}
.tot-box{border:1px solid #e5e7eb;border-radius:10px;padding:10px}
.totales table{margin:0}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-weight:700;font-size:11px}
@media print{ .no-print{display:none} .wrap{padding:0;max-width:700px} }
</style>
</head>
<body>
<div class="wrap">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <h1>Recibo #${r.numero}</h1>
    <span class="badge">${r.estado || 'EMITIDO'}</span>
  </div>

  <div class="grid">
    <div class="box">
      <div class="muted">Cliente</div>
      <div style="font-weight:700">${r.cliente_nombre || '-'}</div>
      ${r.cliente_email ? `<div class="muted">${r.cliente_email}</div>` : ``}
      ${r.cliente_telefono ? `<div class="muted">${r.cliente_telefono}</div>` : ``}
    </div>
    <div class="box">
      <div><strong>Fecha:</strong> ${r.fecha}</div>
      <div><strong>Número:</strong> ${r.numero}</div>
      ${r.notas ? `<div class="muted" style="margin-top:4px">${r.notas}</div>` : ``}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Descripción</th><th class="num">Cant.</th><th class="num">Precio</th>
        <th class="num">Desc.%</th><th class="num">IVA%</th><th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totales">
    <div></div>
    <div class="tot-box">
      <table>
        <tr><td>Subtotal</td><td class="num">${money(r.subtotal)}</td></tr>
        <tr><td>Descuento</td><td class="num">${money(r.descuento_total)}</td></tr>
        <tr><td>Impuesto</td><td class="num">${money(r.impuesto_total)}</td></tr>
        <tr><th>Total</th><th class="num">${money(r.total)}</th></tr>
      </table>
    </div>
  </div>

  <div class="no-print" style="margin-top:14px;color:#64748b">Vista previa del recibo.</div>
</div>
<script>
  if (new URLSearchParams(location.search).get('print') === '1') {
    window.onload = () => setTimeout(() => window.print(), 120);
  }
</script>
</body></html>`;

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (e) { next(e); }
});

/* ============ CREAR ============ */

/** POST /api/recibos  -> crea recibo con líneas */
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.id_cliente) return res.status(400).json({ message: 'Falta id_cliente' });
    if (!b.numero)     return res.status(400).json({ message: 'Falta numero' });
    if (!Array.isArray(b.items) || b.items.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un item en items[]' });
    }

    const out = await crearRecibo({
      id_cliente: Number(b.id_cliente),
      numero: Number(b.numero),
      notas: b.notas || null,
      items: b.items.map(it => ({
        servicio_id: Number(it.servicio_id),
        descripcion: String(it.descripcion || ''),
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio_unitario),
        descuento_pct: Number(it.descuento_pct || 0),
        impuesto_pct: Number(it.impuesto_pct || 0),
      })),
    });

    res.status(201).json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
});

module.exports = router;
