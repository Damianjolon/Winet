const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

exports.login = async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    const [rows] = await pool.query(
      `SELECT id, usuario, password_hash, rol, estado
       FROM TT_USUARIOS
       WHERE usuario = ? LIMIT 1`,
      [usuario]
    );
    if (!rows.length) return res.status(401).json({ error: 'Usuario no encontrado' });
    const u = rows[0];
    if (u.estado === 0) return res.status(403).json({ error: 'Usuario inactivo' });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: u.id, usuario: u.usuario, rol: u.rol },
      process.env.JWT_SECRET || 'cambia_este_secreto',
      { expiresIn: process.env.JWT_EXPIRES || '2h' }
    );

    res.json({ token, user: { id: u.id, usuario: u.usuario, rol: u.rol } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en servidor' });
  }
};

exports.me = async (req, res) => res.json({ user: req.user });
