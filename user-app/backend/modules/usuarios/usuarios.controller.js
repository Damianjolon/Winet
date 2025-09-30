const db = require('../../src/db');

// ======================= HELPERS / CONSTS =======================
const UM_TABLE = process.env.UM_TABLE || 'TT_USUARIO_MODULOS';
const nz = (v) => (v === undefined ? null : v);
const toEstadoNumber = (v) =>
  (typeof v === 'number'
    ? (v === 2 ? 2 : 1)
    : String(v ?? '').toUpperCase().includes('INACTIVO') ? 2 : 1);

// ======================= LISTAR =======================
exports.getUsuarios = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        CONCAT_WS(' ',
          u.primer_nombre,
          u.segundo_nombre,
          u.primer_apellido,
          u.segundo_apellido
        ) AS nombre_completo,
        u.usuario,
        r.nombre AS rol,
        CASE u.estado
          WHEN 1 THEN 'ACTIVO'
          WHEN 2 THEN 'INACTIVO'
          ELSE 'DESCONOCIDO'
        END AS estado
      FROM TT_USUARIOS u
      JOIN TC_ROLES r ON u.id_rol = r.id
      ORDER BY u.id ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('[getUsuarios]', error);
    res.status(500).json({
      message: 'Error al obtener usuarios',
      error: error.sqlMessage || error.message
    });
  }
};

// ======================= OBTENER POR ID (sin password) =======================
exports.getUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.primer_nombre,
        u.segundo_nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.usuario,
        r.nombre AS rol,
        u.estado
      FROM TT_USUARIOS u
      JOIN TC_ROLES r ON u.id_rol = r.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('[getUsuarioPorId]', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.sqlMessage || error.message });
  }
};

// ======================= CREAR =======================
exports.createUsuario = async (req, res) => {
  const primer_nombre    = String(req.body.primer_nombre ?? '').trim();
  const segundo_nombre   = req.body.segundo_nombre ?? null;
  const primer_apellido  = String(req.body.primer_apellido ?? '').trim();
  const segundo_apellido = req.body.segundo_apellido ?? null;
  const usuario          = String(req.body.usuario ?? '').trim();
  const password         = String(req.body.password ?? '').trim();   // obligatorio al crear
  const id_rol           = Number(req.body.id_rol ?? 0);
  const estado           = toEstadoNumber(req.body.estado ?? 1);
  const modulos          = Array.isArray(req.body.modulos)
    ? req.body.modulos.map(Number).filter(n => Number.isInteger(n) && n > 0)
    : [];

  if (!primer_nombre || !primer_apellido || !usuario) {
    return res.status(400).json({ ok:false, message:'primer_nombre, primer_apellido y usuario son obligatorios' });
  }
  if (!password) {
    return res.status(400).json({ ok:false, message:'password es obligatorio' });
  }
  if (!id_rol) {
    return res.status(400).json({ ok:false, message:'id_rol inválido' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[dup]] = await conn.query('SELECT id FROM TT_USUARIOS WHERE usuario = ? LIMIT 1', [usuario]);
    if (dup) {
      await conn.rollback();
      return res.status(409).json({ ok:false, message:'El nombre de usuario ya existe' });
    }

    const params = [
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      usuario, password, id_rol, estado
    ].map(nz);

    const [u] = await conn.execute(
      `INSERT INTO TT_USUARIOS
        (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, usuario, password, id_rol, estado)
       VALUES (?,?,?,?,?,?,?,?)`,
      params
    );
    const userId = u.insertId;

    if (modulos.length) {
      const placeholders = modulos.map(() => '(?,?)').join(',');
      const flat = modulos.flatMap(m => [userId, m]);
      await conn.execute(
        `INSERT INTO ${UM_TABLE} (id_usuario, id_modulo) VALUES ${placeholders}`,
        flat
      );
    }

    // Construye datos de respuesta
    const nombre_completo = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
      .filter(Boolean)
      .join(' ');

    // Si quieres nombres de módulos desde backend:
    let modulosDetalle = [];
    if (modulos.length) {
      const inPh = modulos.map(() => '?').join(',');
      const [mods] = await conn.query(
        `SELECT id, nombre FROM TC_MODULOS WHERE id IN (${inPh})`,
        modulos
      );
      modulosDetalle = mods; // [{id, nombre}]
    }

    await conn.commit();

    return res.status(201).json({
      ok: true,
      id: userId,
      usuario,
      nombre_completo,
      modulos: modulosDetalle,         // si no quieres los nombres, puedes enviar solo IDs
      modulosInsertados: modulosDetalle.length
    });
  } catch (err) {
    await conn.rollback();
    console.error('[createUsuario] SQL ERROR:', {
      code: err.code, errno: err.errno, sqlMessage: err.sqlMessage, sqlState: err.sqlState
    });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ ok:false, message:'id_rol o id_modulo no existe' });
    }
    return res.status(500).json({ ok:false, message:'No se pudo crear el usuario', error: err.message });
  } finally {
    conn.release();
  }
};

// ======================= ACTUALIZAR =======================
exports.updateUsuario = async (req, res) => {
  const { id }           = req.params;
  const primer_nombre    = String(req.body.primer_nombre ?? '').trim();
  const segundo_nombre   = req.body.segundo_nombre ?? null;
  const primer_apellido  = String(req.body.primer_apellido ?? '').trim();
  const segundo_apellido = req.body.segundo_apellido ?? null;
  const usuario          = String(req.body.usuario ?? '').trim();
  const id_rol           = Number(req.body.id_rol ?? 0);
  const estado           = toEstadoNumber(req.body.estado ?? 1);
  const password         = String(req.body.password ?? '').trim();   // opcional al editar
  const modulos          = Array.isArray(req.body.modulos)
    ? req.body.modulos.map(Number).filter(n => Number.isInteger(n) && n > 0)
    : [];

  if (!primer_nombre || !primer_apellido || !usuario) {
    return res.status(400).json({ ok:false, message:'primer_nombre, primer_apellido y usuario son obligatorios' });
  }
  if (!id_rol) {
    return res.status(400).json({ ok:false, message:'id_rol inválido' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[dup]] = await conn.query(
      'SELECT id FROM TT_USUARIOS WHERE usuario = ? AND id <> ? LIMIT 1',
      [usuario, id]
    );
    if (dup) {
      await conn.rollback();
      return res.status(409).json({ ok:false, message:'El nombre de usuario ya existe' });
    }

    let sql = `
      UPDATE TT_USUARIOS
         SET primer_nombre=?, segundo_nombre=?, primer_apellido=?, segundo_apellido=?,
             usuario=?, id_rol=?, estado=?`;
    const params = [
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      usuario, id_rol, estado
    ].map(nz);

    if (password) {
      sql += `, password=?`;
      params.push(password);
    }
    sql += ` WHERE id=?`;
    params.push(id);

    await conn.execute(sql, params);

    // Reemplaza módulos
    await conn.execute(`DELETE FROM ${UM_TABLE} WHERE id_usuario=?`, [id]);
    if (modulos.length) {
      const placeholders = modulos.map(() => '(?,?)').join(',');
      const flat = modulos.flatMap(m => [id, m]);
      await conn.execute(`INSERT INTO ${UM_TABLE} (id_usuario, id_modulo) VALUES ${placeholders}`, flat);
    }

    await conn.commit();
    return res.json({ ok:true, modulosInsertados: modulos.length });
  } catch (err) {
    await conn.rollback();
    console.error('[updateUsuario] SQL ERROR:', {
      code: err.code, errno: err.errno, sqlMessage: err.sqlMessage, sqlState: err.sqlState
    });
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok:false, message:'El nombre de usuario ya existe' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ ok:false, message:'id_rol o id_modulo no existe' });
    }
    return res.status(500).json({ ok:false, message:'No se pudo actualizar el usuario', error: err.message });
  } finally {
    conn.release();
  }
};

// ======================= ELIMINAR =======================
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(`DELETE FROM TT_USUARIOS WHERE id = ?`, [id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('[deleteUsuario]', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.sqlMessage || error.message });
  }
};

// ======================= ESTADO =======================
exports.cambiarEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const estado = (String(req.body?.estado).toUpperCase().includes('INACTIVO') || Number(req.body?.estado) === 2) ? 2 : 1;
  try {
    const [r] = await db.execute(`UPDATE TT_USUARIOS SET estado=? WHERE id=?`, [estado, id]);
    if (r.affectedRows === 0) return res.status(404).json({ ok:false, message:'Usuario no encontrado' });
    res.json({ ok:true, id:Number(id), estado, estado_text: estado === 1 ? 'ACTIVO' : 'INACTIVO' });
  } catch (e) {
    console.error('[cambiarEstadoUsuario]', e);
    res.status(500).json({ ok:false, message:'No se pudo cambiar estado', error:e.message });
  }
};

exports.toggleEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [[u]] = await db.query(`SELECT estado FROM TT_USUARIOS WHERE id=?`, [id]);
    if (!u) return res.status(404).json({ ok:false, message:'Usuario no encontrado' });
    const nuevo = Number(u.estado) === 1 ? 2 : 1;
    const [r] = await db.execute(`UPDATE TT_USUARIOS SET estado=? WHERE id=?`, [nuevo, id]);
    if (r.affectedRows === 0) return res.status(404).json({ ok:false, message:'Usuario no encontrado' });
    res.json({ ok:true, id:Number(id), estado:nuevo, estado_text: nuevo === 1 ? 'ACTIVO' : 'INACTIVO' });
  } catch (e) {
    console.error('[toggleEstadoUsuario]', e);
    res.status(500).json({ ok:false, message:'No se pudo alternar estado', error:e.message });
  }
};

console.log('Funciones exportadas:', Object.keys(module.exports));
