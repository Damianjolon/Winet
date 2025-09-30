const express = require('express');
const router = express.Router();
const { crearRecibo, getRecibo } = require('./recibos.repo');
const pool = require('../../prisma/pool'); // para endpoints de preview

// POST /api/recibos  (crear)
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!Array.isArray(body.items) || body.items.length === 0)
      return res.status(400).json({ message: 'items vacíos' });
    const out = await crearRecibo(body);
    res.status(201).json(out);
  } catch (e) { next(e); }
});

// GET /api/recibos/:id  (detalle)
router.get('/:id', async (req, res) => {
  const rec = await getRecibo(Number(req.params.id));
  if (!rec) return res.sendStatus(404);
  res.json(rec);
});

// GET /api/recibos/:id/preview  (HTML simple para imprimir)
router.get('/:id/preview', async (req, res) => {
  const id = Number(req.params.id);
  const [[hdr]] = await pool.query(
    `SELECT r.*, c.nombre AS cliente_nombre, c.nit
       FROM TT_RECIBO r LEFT JOIN TC_CLIENTES c ON c.id=r.cliente_id
      WHERE r.id=?`, [id]);
  if (!hdr) return res.sendStatus(404);

  const [itemsS] = await pool.query(`SELECT 'SERVICIO' tipo, descripcion, cantidad, precio_unitario, total_linea FROM TT_RECIBO_SERVICIOS WHERE recibo_id=?`, [id]);
  const [itemsP] = await pool.query(`SELECT 'PRODUCTO' tipo, descripcion, cantidad, precio_unitario, total_linea FROM TT_RECIBO_PRODUCTOS WHERE recibo_id=?`, [id]);
  const items = [...itemsS, ...itemsP];

  const rows = items.map(x => `
    <tr>
      <td>${x.tipo}</td>
      <td>${x.descripcion}</td>
      <td style="text-align:right">${Number(x.cantidad).toFixed(3)}</td>
      <td style="text-align:right">${Number(x.precio_unitario).toFixed(2)}</td>
      <td style="text-align:right">${Number(x.total_linea).toFixed(2)}</td>
    </tr>`).join('');

  const html = `
  <html><head><meta charset="utf-8"><title>Recibo ${hdr.serie}-${hdr.numero}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:24px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:6px}
    .tot{text-align:right}
  </style></head><body>
    <h2>Recibo ${hdr.serie}-${hdr.numero}</h2>
    <div><b>Cliente:</b> ${hdr.cliente_nombre || ''} &nbsp; <b>NIT:</b> ${hdr.nit || ''}</div>
    <div><b>Fecha:</b> ${new Date(hdr.fecha).toLocaleString()}</div><br/>
    <table><thead><tr><th>Tipo</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table><br/>
    <div class="tot">
      <div><b>Subtotal:</b> Q${Number(hdr.subtotal).toFixed(2)}</div>
      <div><b>Descuento:</b> Q${Number(hdr.descuento_total).toFixed(2)}</div>
      <div><b>Impuesto:</b> Q${Number(hdr.impuesto_total).toFixed(2)}</div>
      <div style="font-size:18px"><b>Total:</b> Q${Number(hdr.total).toFixed(2)}</div>
    </div>
  </body></html>`;
  res.set('Content-Type', 'text/html; charset=utf-8').send(html);
});

// GET /api/recibos/:id/whatsapp-text  (texto para enviar)
router.get('/:id/whatsapp-text', async (req, res) => {
  const id = Number(req.params.id);
  const [[r]] = await pool.query(`SELECT serie, numero, total FROM TT_RECIBO WHERE id=?`, [id]);
  if (!r) return res.sendStatus(404);
  res.json({ message: `Recibo ${r.serie}-${r.numero} por Q${Number(r.total).toFixed(2)}. ¡Gracias por su preferencia!` });
});

module.exports = router;
