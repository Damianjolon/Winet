const jwt = require('jsonwebtoken');
const JWT_SECRET  = process.env.JWT_SECRET  || 'dev';

exports.authRequired = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, error:'No autenticado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, usuario, id_rol, jti, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ ok:false, error:'Token inválido o expirado' });
  }
};
