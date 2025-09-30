// /modules/modulos/modulos.controller.js
const db = require('../../src/db');

exports.getModulos = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre
         FROM TC_MODULOS
        WHERE nombre IS NOT NULL AND nombre <> ''
        ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener módulos:', err);
    res.status(500).json({ error: 'Error al obtener módulos' });
  }
};
