const express = require('express');
const router = express.Router();
const pool = require('../../prisma/pool'); // ajusta la ruta

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const [rows] = await pool.query(
    `SELECT id, sku, nombre, precio
       FROM TC_SERVICIOS
      WHERE activo = 1
        AND (? = '' OR nombre LIKE CONCAT('%', ?, '%') OR sku LIKE CONCAT('%', ?, '%'))
      ORDER BY nombre LIMIT 100`,
    [q, q, q]
  );
  res.json(rows);
});

module.exports = router;
