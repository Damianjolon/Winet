// Obtener roles
exports.getRoles = async (_req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, nombre FROM TC_ROLES`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// Crear usuario con contraseña
exports.createUsuario = async (req, res) => {
  try {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      usuario,
      password,
      id_rol,
      estado
    } = req.body;

    if (!primer_nombre || !primer_apellido || !usuario || !password || !id_rol) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const sql = `
      INSERT INTO TT_USUARIOS
      (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, usuario, password, id_rol, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      usuario,
      password,   // ⚠️ plano, recuerda hashear después
      id_rol,
      estado ?? 1 // si no viene, por defecto activo
    ]);

    res.json({ ok: true, message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('[createUsuario]', error);
    res.status(500).json({ ok: false, message: 'Error al crear usuario', error: error.sqlMessage || error.message });
  }
};
