const db = require('../../src/db');

exports.getRoles = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM TC_ROLES
      WHERE nombre IS NOT NULL AND nombre <> ''
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('[getRoles]', err);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};
