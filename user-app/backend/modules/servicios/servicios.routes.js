const express = require('express');
const router = express.Router();
const db = require('../../src/db');

// GET /api/servicios?q=texto
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const [rows] = await db.query(
      `SELECT id, codigo, nombre, precio_unitario, impuesto_pct
         FROM TC_SERVICIOS
        WHERE activo = 1
          AND (? = '' OR nombre LIKE CONCAT('%', ?, '%') OR codigo LIKE CONCAT('%', ?, '%'))
        ORDER BY nombre
        LIMIT 100`,
      [q, q, q]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
