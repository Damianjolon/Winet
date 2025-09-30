const express = require('express');
const router = express.Router();
const {
  registrarMovimiento,
  kardexProducto,
  productosConAlerta,
  setStockMinimo
} = require('./inventario.repo');

// POST /api/inventario/movimientos  (alta/baja)
router.post('/movimientos', async (req, res, next) => {
  try {
    const out = await registrarMovimiento({
      producto_id: req.body.producto_id,
      tipo: req.body.tipo,
      cantidad: req.body.cantidad,
      costo_unitario: req.body.costo_unitario,
      doc_tipo: req.body.doc_tipo,
      doc_id: req.body.doc_id,
      observacion: req.body.observacion,
      permitirNegativo: !!req.body.permitirNegativo
    });
    res.status(201).json(out);
  } catch (e) {
    if (e.code === 'STOCK_INSUFICIENTE') return res.status(409).json({ message: e.message });
    next(e);
  }
});

// GET /api/inventario/productos/:id/kardex?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/productos/:id/kardex', async (req, res, next) => {
  try {
    const out = await kardexProducto(Number(req.params.id), {
      desde: req.query.desde,
      hasta: req.query.hasta
    });
    res.json(out);
  } catch (e) { next(e); }
});

// GET /api/inventario/alertas
router.get('/alertas', async (_req, res, next) => {
  try {
    const rows = await productosConAlerta();
    res.json(rows);
  } catch (e) { next(e); }
});

// PUT /api/inventario/productos/:id/stock-minimo
router.put('/productos/:id/stock-minimo', async (req, res, next) => {
  try {
    const row = await setStockMinimo(Number(req.params.id), req.body.stock_minimo);
    res.json(row);
  } catch (e) { next(e); }
});

module.exports = router;
