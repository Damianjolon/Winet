// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'cambia_este_secreto');
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.length || roles.includes(req.user.rol)) return next();
    return res.status(403).json({ error: 'No autorizado' });
  };
}

module.exports = { verifyToken, allowRoles };
