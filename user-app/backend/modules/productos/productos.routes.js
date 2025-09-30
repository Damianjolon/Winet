const express = require('express');
const router = express.Router();
const pool = require('../../prisma/pool'); // ajusta la ruta

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const [rows] = await pool.query(
    `SELECT id, sku, nombre, precio_sugerido, stock_actual
       FROM TC_PRODUCTOS
      WHERE activo = 1
        AND (? = '' OR nombre LIKE CONCAT('%', ?, '%') OR sku LIKE CONCAT('%', ?, '%'))
      ORDER BY nombre LIMIT 100`,
    [q, q, q]
  );
  res.json(rows);
});

// Kardex (por ahora solo salidas por recibos)
router.get('/:id/kardex', async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT rp.id, r.fecha, 'SALIDA' AS tipo, rp.cantidad, rp.precio_unitario, r.serie, r.numero
       FROM TT_RECIBO_PRODUCTOS rp
       JOIN TT_RECIBO r ON r.id = rp.recibo_id
      WHERE rp.producto_id = ?
      ORDER BY r.fecha DESC, rp.id DESC
      LIMIT 300`, [id]
  );
  res.json(rows);
});

module.exports = router;
