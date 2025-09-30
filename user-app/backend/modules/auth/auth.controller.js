const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/db');

// util local
function isBcryptHash(s) {
  return typeof s === 'string' && /^\$2[aby]\$\d{2}\$/.test(s);
}
const JWT_SECRET  = process.env.JWT_SECRET  || 'dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '2h';
const RESET_TTL_HOURS = Number(process.env.RESET_TOKEN_EXPIRES_HOURS || 2);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200'; // para el link de reset

// rate-limit suave en memoria (por IP+usuario) — simple y suficiente
const attempts = new Map(); // key: ip|userKey -> { count, until }
function tooManyAttempts(key) {
  const now = Date.now();
  const e = attempts.get(key);
  if (e && e.until > now) return true;
  return false;
}
function registerFail(key) {
  const now = Date.now();
  const e = attempts.get(key) || { count: 0, until: 0 };
  const count = e.count + 1;
  // 5 fallos -> bloqueo 5 minutos
  const until = count >= 5 ? now + 5 * 60 * 1000 : 0;
  attempts.set(key, { count, until });
}
function resetAttempts(key) {
  attempts.delete(key);
}

// ============================== LOGIN ==============================
exports.login = async (req, res) => {
  try {
    console.log('[login] body:', req.body);
    let { usuario, email, password, remember } = req.body || {};
    const rawUser = (usuario ?? email ?? '').toString();
    const userKey = rawUser.trim().toLowerCase();
    const ip = req.ip?.replace('::ffff:','') || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const rlKey = `${ip}|${userKey}`;

    if (!userKey || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'Faltan credenciales' });
    }
    if (tooManyAttempts(rlKey)) {
      return res.status(429).json({ ok: false, error: 'Demasiados intentos. Intenta más tarde.' });
    }

    // Usuario de emergencia (sólo pruebas locales)
    if (userKey === 'emergencia' && password === '1234') {
      const jti = uuidv4();
      const payload = { id: 0, usuario: 'emergencia', id_rol: 1, rol: 'admin', jti };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES, jwtid: jti });
      // registra sesión
      await db.query(
        'INSERT INTO TT_USUARIOS_SESIONES (id_usuario, jti, ip, user_agent, remember) VALUES (?,?,?,?,?)',
        [0, jti, ip, ua, remember ? 1 : 0]
      );
      return res.json({ ok: true, token, user: payload });
    }

    // Trae por usuario o por email
    const [rows] = await db.query(
      `SELECT id, usuario, email, password, id_rol, estado
         FROM TT_USUARIOS
        WHERE LOWER(usuario)=? OR LOWER(email)=?
        LIMIT 1`,
      [userKey, userKey]
    );
    if (!rows || rows.length === 0) {
      registerFail(rlKey);
      return res.status(401).json({ ok: false, error: 'Usuario no encontrado' });
    }
    const user = rows[0];
    if (Number(user.estado) === 0) {
      return res.status(403).json({ ok: false, error: 'Usuario inactivo' });
    }

    const hashed = user.password || '';
    const passOK = isBcryptHash(hashed)
      ? await bcrypt.compare(password, hashed)
      : (password === hashed);

    if (!passOK) {
      registerFail(rlKey);
      return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
    }

    // Migración automática a bcrypt si detectamos contraseña plana
    if (!isBcryptHash(hashed)) {
      const newHash = await bcrypt.hash(password, 10);
      await db.query('UPDATE TT_USUARIOS SET password=? WHERE id=?', [newHash, user.id]);
    }

    const jti = uuidv4();
    const payload = { id: user.id, usuario: user.usuario, id_rol: user.id_rol, jti };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES, jwtid: jti });

    // registra sesión (👉 “registro del usuario loggeado adentro del sistema”)
    await db.query(
      'INSERT INTO TT_USUARIOS_SESIONES (id_usuario, jti, ip, user_agent, remember) VALUES (?,?,?,?,?)',
      [user.id, jti, ip, ua, remember ? 1 : 0]
    );
    await db.query('UPDATE TT_USUARIOS SET ultimo_login=NOW() WHERE id=?', [user.id]);

    resetAttempts(rlKey);
    return res.json({ ok: true, token, user: { id: user.id, usuario: user.usuario, id_rol: user.id_rol } });
  } catch (err) {
    console.error('[auth.login] Error:', err);
    return res.status(500).json({ ok: false, error: err.sqlMessage || err.message || 'Error en login' });
  }
};

// ============================== ME ==============================
exports.me = async (req, res) => {
  // req.user viene del middleware authRequired
  res.json({ ok: true, user: req.user });
};

// ============================== LOGOUT ==============================
exports.logout = async (req, res) => {
  try {
    const jti = req.user?.jti;
    if (jti) {
      await db.query('UPDATE TT_USUARIOS_SESIONES SET active=0, logout_at=NOW() WHERE jti=?', [jti]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
};

// ============================== FORGOT PASSWORD ==============================
exports.forgotPassword = async (req, res) => {
  try {
    const { usuarioOrEmail } = req.body || {};
    if (!usuarioOrEmail) return res.status(400).json({ ok:false, error:'Falta usuario o email' });

    const key = usuarioOrEmail.trim().toLowerCase();
    const [rows] = await db.query(
      `SELECT id, email, usuario FROM TT_USUARIOS WHERE LOWER(usuario)=? OR LOWER(email)=? LIMIT 1`,
      [key, key]
    );
    if (!rows || rows.length === 0) {
      // No reveles si existe – respuesta genérica
      return res.json({ ok:true, message:'Si existe el usuario, se enviará un correo con instrucciones.' });
    }
    const u = rows[0];

    const tokenPlain = crypto.randomBytes(32).toString('hex');
    const tokenHash  = crypto.createHash('sha256').update(tokenPlain).digest('hex');
    const expiresAt  = new Date(Date.now() + RESET_TTL_HOURS * 3600 * 1000);
    const ip = req.ip?.replace('::ffff:','') || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';

    await db.query(
      `INSERT INTO TT_RESET_PASSWORD (id_usuario, token_hash, expires_at, ip, user_agent) VALUES (?,?,?,?,?)`,
      [u.id, tokenHash, expiresAt, ip, ua]
    );

    // Enviar correo (si tienes SMTP); en dev devolvemos el link
    const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${tokenPlain}`;
    if (process.env.NODE_ENV === 'production') {
      // TODO: integra nodemailer aquí
      console.log('[forgotPassword] En producción, enviar email con link:', resetLink);
      return res.json({ ok:true, message:'Revisa tu correo para restablecer tu contraseña.' });
    } else {
      // útil para pruebas locales
      return res.json({ ok:true, resetLink, token: tokenPlain, message:'Usa este link/token en desarrollo.' });
    }
  } catch (e) {
    console.error('[forgotPassword] Error:', e);
    res.status(500).json({ ok:false, error:e.message });
  }
};

// ============================== RESET PASSWORD ==============================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ ok:false, error:'Faltan datos' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [[row]] = await db.query(
      `SELECT rp.id, rp.id_usuario, rp.expires_at, rp.used, u.id AS uid
         FROM TT_RESET_PASSWORD rp
         JOIN TT_USUARIOS u ON u.id = rp.id_usuario
        WHERE rp.token_hash = ?`,
      [tokenHash]
    );
    if (!row) return res.status(400).json({ ok:false, error:'Token inválido' });
    if (row.used) return res.status(400).json({ ok:false, error:'Token ya usado' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ ok:false, error:'Token expirado' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE TT_USUARIOS SET password=? WHERE id=?', [hash, row.id_usuario]);
    await db.query('UPDATE TT_RESET_PASSWORD SET used=1, used_at=NOW() WHERE id=?', [row.id]);

    // invalida sesiones activas del usuario
    await db.query('UPDATE TT_USUARIOS_SESIONES SET active=0, logout_at=NOW() WHERE id_usuario=? AND active=1', [row.id_usuario]);

    res.json({ ok:true, message:'Contraseña actualizada. Inicia sesión nuevamente.' });
  } catch (e) {
    console.error('[resetPassword] Error:', e);
    res.status(500).json({ ok:false, error:e.message });
  }
};

// ============================== ROLES (igual al tuyo) ==============================
exports.getRoles = async (_req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, nombre FROM TC_ROLES`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// ============================== CREATE USUARIO (ahora con hash) ==============================
exports.createUsuario = async (req, res) => {
  try {
    const {
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      usuario, email, password, id_rol, estado
    } = req.body;

    if (!primer_nombre || !primer_apellido || !usuario || !password || !id_rol) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const [dup] = await db.query(`SELECT 1 FROM TT_USUARIOS WHERE usuario=? OR email=? LIMIT 1`, [usuario, email || null]);
    if (dup.length) return res.status(409).json({ ok:false, message:'Usuario o email ya existente' });

    const hash = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO TT_USUARIOS
      (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, usuario, email, password, id_rol, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      usuario, email || null, hash, id_rol, estado ?? 1
    ]);

    res.json({ ok: true, message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('[createUsuario]', error);
    res.status(500).json({ ok: false, message: 'Error al crear usuario', error: error.sqlMessage || error.message });
  }
};



// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('../../src/db');

// function isBcryptHash(s) {
//   return typeof s === 'string' && /^\$2[aby]\$\d{2}\$/.test(s);
// }

// async function login(req, res) {
//   try {
//     // Log para diagnosticar rápidamente lo que llega del front
//     console.log('[login] body:', req.body);

//     // Acepta { usuario, password } o { email, password }
//     let { usuario, email, password } = req.body || {};
//     const rawUser = (usuario ?? email ?? '').toString(); // evita undefined
//     const userKey = rawUser.trim().toLowerCase();

//     if (!userKey || typeof password !== 'string') {
//       return res.status(400).json({ ok: false, error: 'Faltan credenciales' });
//     }

//     // Usuario de emergencia (solo pruebas)
//     if (userKey === 'emergencia' && password === '1234') {
//       const token = jwt.sign(
//         { id: 0, usuario: 'emergencia', id_rol: 1, rol: 'admin' },
//         process.env.JWT_SECRET || 'dev',
//         { expiresIn: process.env.JWT_EXPIRES || '2h' }
//       );
//       return res.json({ ok: true, token, user: { id: 0, usuario: 'emergencia', id_rol: 1 } });
//     }

//     // Trae solo columnas necesarias (ajusta nombres si en tu BD son otros)
//     const [rows] = await db.query(
//       'SELECT id, usuario, password, id_rol, estado FROM TT_USUARIOS WHERE LOWER(usuario) = ? LIMIT 1',
//       [userKey]
//     );

//     if (!rows || rows.length === 0) {
//       return res.status(401).json({ ok: false, error: 'Usuario no encontrado' });
//     }

//     const user = rows[0];

//     if (Number(user.estado) === 0) {
//       return res.status(403).json({ ok: false, error: 'Usuario inactivo' });
//     }

//     const hashed = user.password || '';
//     const passOK = isBcryptHash(hashed)
//       ? await bcrypt.compare(password, hashed)
//       : (password === hashed);

//     if (!passOK) {
//       return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
//     }

//     const payload = { id: user.id, usuario: user.usuario, id_rol: user.id_rol };
//     const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev', {
//       expiresIn: process.env.JWT_EXPIRES || '2h'
//     });

//     return res.json({ ok: true, token, user: payload });
//   } catch (err) {
//     console.error('[auth.login] Error:', {
//       message: err.message,
//       sql: err.sqlMessage,
//       code: err.code,
//       stack: err.stack
//     });
//     return res.status(500).json({
//       ok: false,
//       error: err.sqlMessage || err.message || 'Error en login'
//     });
//   }
// }

// module.exports = { login };
