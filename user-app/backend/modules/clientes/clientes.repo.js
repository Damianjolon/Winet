const pool = require('../../src/db');

// IDs reales en TC_ESTADOS para la tabla TT_CLIENTES
const CLIENTE_ESTADO_ACTIVO_ID = 2;
const CLIENTE_ESTADO_INACTIVO_ID = 3;

/** Convierte cualquier entrada de estado (1/0, 'activo'/'inactivo', 2/3) al ID correcto (2/3) */
function toClienteEstadoId(v, def = CLIENTE_ESTADO_ACTIVO_ID) {
  if (v === undefined || v === null || v === '') return def;
  const s = String(v).trim().toLowerCase();
  if (s === '1' || s === 'activo') return CLIENTE_ESTADO_ACTIVO_ID;      // 2
  if (s === '0' || s === 'inactivo') return CLIENTE_ESTADO_INACTIVO_ID;  // 3
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (n === 1) return CLIENTE_ESTADO_ACTIVO_ID;
    if (n === 0) return CLIENTE_ESTADO_INACTIVO_ID;
    return n; // permite 2/3 directos
  }
  return def;
}

function mapRow(r) {
  const nombre = [r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido]
    .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  return {
    // DB
    id: r.id,
    primer_nombre: r.primer_nombre,
    segundo_nombre: r.segundo_nombre,
    primer_apellido: r.primer_apellido,
    segundo_apellido: r.segundo_apellido,
    correo: r.correo,
    direccion: r.direccion,
    zona: r.zona,
    colonia: r.colonia,
    id_departamento: r.id_departamento,          // ← NUEVO
    id_municipio: r.id_municipio,
    id_estado: r.id_estado,
    Telefono: r.Telefono,
    created_at: r.created_at,
    updated_at: r.updated_at,

    // Derivados / catálogos
    municipio_nombre: r.municipio_nombre ?? null,      // viene del JOIN
    departamento_nombre: r.departamento_nombre ?? null,

    // Derivados para UI
    nombre,
    email: r.correo,
    telefono: r.Telefono
  };
}

/**
 * Listado con filtros y paginación.
 * Soporta filtro por q, estado, municipio y departamento (nuevo).
 */
async function listar({
  q, estado, municipio, departamento, page = 1, pageSize = 20, sort = 'nombre', order = 'asc'
}) {
  page = Math.max(1, Number(page));
  pageSize = Math.min(100, Math.max(1, Number(pageSize)));
  const offset = (page - 1) * pageSize;

  const sortMap = {
    nombre: "c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido",
    correo: "c.correo",
    created_at: "c.created_at",
    id: "c.id"
  };
  const sortExpr = sortMap[sort] || sortMap.nombre;
  const dir = (String(order).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

  const where = [];
  const params = { offset, pageSize };

  if (q) {
    where.push(`(
      LOWER(CONCAT_WS(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido)) LIKE :q
      OR LOWER(c.correo) LIKE :q
      OR REPLACE(c.\`Telefono\`, '-', '') LIKE REPLACE(:qraw, '-', '')
    )`);
    params.q = `%${q.toLowerCase()}%`;
    params.qraw = q;
  }

  const estadoId = (estado !== undefined && estado !== null && estado !== '') ? toClienteEstadoId(estado) : null;
  if (estadoId !== null) {
    where.push(`c.id_estado = :estado`);
    params.estado = estadoId;
  }

  if (municipio) {
    where.push(`c.id_municipio = :mun`);
    params.mun = Number(municipio);
  }

  if (departamento) {
    where.push(`c.id_departamento = :dep`);     // ← NUEVO
    params.dep = Number(departamento);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT SQL_CALC_FOUND_ROWS
           c.*,
           m.nombre AS municipio_nombre,
           d.nombre AS departamento_nombre
    FROM TT_CLIENTES c
    LEFT JOIN TC_MUNICIPIOS    m ON m.id = c.id_municipio
    LEFT JOIN TC_DEPARTAMENTOS d ON d.id = c.id_departamento
    ${whereSql}
    ORDER BY ${sortExpr} ${dir}
    LIMIT :offset, :pageSize
    `,
    params
  );
  const [[tot]] = await pool.query('SELECT FOUND_ROWS() AS total');
  return { items: rows.map(mapRow), total: tot?.total ?? 0, page, pageSize };
}

async function obtener(id) {
  const [rows] = await pool.query(
    `
    SELECT c.*,
           m.nombre AS municipio_nombre,
           d.nombre AS departamento_nombre
    FROM TT_CLIENTES c
    LEFT JOIN TC_MUNICIPIOS    m ON m.id = c.id_municipio
    LEFT JOIN TC_DEPARTAMENTOS d ON d.id = c.id_departamento
    WHERE c.id = :id
    `,
    { id }
  );
  if (!rows.length) return null;
  return mapRow(rows[0]);
}

async function crear(data) {
  const sql = `
    INSERT INTO TT_CLIENTES
    (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
     correo, direccion, zona, colonia,
     id_departamento, id_municipio, id_estado, \`Telefono\`,
     created_at, updated_at)
    VALUES
    (:primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido,
     :correo, :direccion, :zona, :colonia,
     :id_departamento, :id_municipio, :id_estado, :telefono,
     NOW(), NOW())
  `;
  const params = {
    primer_nombre:   data.primer_nombre,
    segundo_nombre:  data.segundo_nombre ?? null,
    primer_apellido: data.primer_apellido,
    segundo_apellido:data.segundo_apellido ?? null,
    correo:          data.correo,
    direccion:       data.direccion ?? null,
    zona:            data.zona ?? null,
    colonia:         data.colonia ?? null,
    id_departamento: data.id_departamento ?? null,     // ← NUEVO
    id_municipio:    data.id_municipio ?? null,
    id_estado:       toClienteEstadoId(data.id_estado, CLIENTE_ESTADO_ACTIVO_ID),
    telefono:        data.telefono ?? data.Telefono ?? null
  };
  const [res] = await pool.query(sql, params);
  return obtener(res.insertId);
}

async function actualizar(id, data) {
  const set = [];
  const params = { id };

  function add(col, param, ...keys) {
    for (const k of keys) {
      if (data[k] !== undefined) {
        set.push(`\`${col}\` = :${param}`);
        params[param] = data[k];
        return true;
      }
    }
    return false;
  }

  add('primer_nombre',   'primer_nombre',   'primer_nombre');
  add('segundo_nombre',  'segundo_nombre',  'segundo_nombre');
  add('primer_apellido', 'primer_apellido', 'primer_apellido');
  add('segundo_apellido','segundo_apellido','segundo_apellido');
  add('correo',          'correo',          'correo');
  add('direccion',       'direccion',       'direccion');
  add('zona',            'zona',            'zona');
  add('colonia',         'colonia',         'colonia');
  add('id_departamento', 'id_departamento', 'id_departamento'); // ← NUEVO
  add('id_municipio',    'id_municipio',    'id_municipio');

  if (data.id_estado !== undefined) {
    set.push('`id_estado` = :id_estado');
    params.id_estado = toClienteEstadoId(data.id_estado);
  }

  add('Telefono',        'telefono',        'telefono', 'Telefono');

  if (!set.length) return obtener(id);

  await pool.query(`UPDATE TT_CLIENTES SET ${set.join(', ')}, updated_at = NOW() WHERE id = :id`, params);
  return obtener(id);
}

/** Soft delete = id_estado = 3 (Inactivo). Hard delete = DELETE. */
async function eliminar(id, hard = false) {
  if (hard) {
    await pool.query(`DELETE FROM TT_CLIENTES WHERE id = :id`, { id });
    return { ok: true, hard: true };
  }
  await pool.query(
    `UPDATE TT_CLIENTES SET id_estado = :inac, updated_at = NOW() WHERE id = :id`,
    { id, inac: CLIENTE_ESTADO_INACTIVO_ID }
  );
  return { ok: true, hard: false };
}

async function stats() {
  const [[a]] = await pool.query(`SELECT COUNT(*) total FROM TT_CLIENTES`);
  const [[b]] = await pool.query(
    `SELECT COUNT(*) activos FROM TT_CLIENTES WHERE id_estado = :act`,
    { act: CLIENTE_ESTADO_ACTIVO_ID }
  );
  return { total: a?.total ?? 0, activos: b?.activos ?? 0 };
}

module.exports = { listar, obtener, crear, actualizar, eliminar, stats };


// const pool = require('../../src/db');

// // IDs reales en TC_ESTADOS para la tabla TT_CLIENTES
// const CLIENTE_ESTADO_ACTIVO_ID = 2;
// const CLIENTE_ESTADO_INACTIVO_ID = 3;

// /** Convierte cualquier entrada de estado (1/0, 'activo'/'inactivo', 2/3) al ID correcto (2/3) */
// function toClienteEstadoId(v, def = CLIENTE_ESTADO_ACTIVO_ID) {
//   if (v === undefined || v === null || v === '') return def;
//   const s = String(v).trim().toLowerCase();
//   if (s === '1' || s === 'activo') return CLIENTE_ESTADO_ACTIVO_ID;      // 2
//   if (s === '0' || s === 'inactivo') return CLIENTE_ESTADO_INACTIVO_ID;  // 3
//   const n = Number(s);
//   if (!Number.isNaN(n)) {
//     if (n === 1) return CLIENTE_ESTADO_ACTIVO_ID;
//     if (n === 0) return CLIENTE_ESTADO_INACTIVO_ID;
//     return n; // permite 2/3 directos
//   }
//   return def;
// }

// function mapRow(r) {
//   const nombre = [r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido]
//     .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

//   return {
//     // DB
//     id: r.id,
//     primer_nombre: r.primer_nombre,
//     segundo_nombre: r.segundo_nombre,
//     primer_apellido: r.primer_apellido,
//     segundo_apellido: r.segundo_apellido,
//     correo: r.correo,
//     direccion: r.direccion,
//     zona: r.zona,
//     colonia: r.colonia,
//     id_municipio: r.id_municipio,
//     id_estado: r.id_estado,
//     Telefono: r.Telefono,
//     created_at: r.created_at,
//     updated_at: r.updated_at,
//     // Derivados para UI
//     nombre,
//     email: r.correo,
//     telefono: r.Telefono
//   };
// }

// async function listar({ q, estado, municipio, page = 1, pageSize = 20, sort = 'nombre', order = 'asc' }) {
//   page = Math.max(1, Number(page));
//   pageSize = Math.min(100, Math.max(1, Number(pageSize)));
//   const offset = (page - 1) * pageSize;

//   const sortMap = {
//     nombre: "primer_nombre, segundo_nombre, primer_apellido, segundo_apellido",
//     correo: "correo",
//     created_at: "created_at",
//     id: "id"
//   };
//   const sortExpr = sortMap[sort] || sortMap.nombre;
//   const dir = (String(order).toLowerCase() === 'desc') ? 'DESC' : 'ASC';

//   const where = [];
//   const params = {};

//   if (q) {
//     where.push(`(
//       LOWER(CONCAT_WS(' ', primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)) LIKE :q
//       OR LOWER(correo) LIKE :q
//       OR REPLACE(\`Telefono\`, '-', '') LIKE REPLACE(:qraw, '-', '')
//     )`);
//     params.q = `%${q.toLowerCase()}%`;
//     params.qraw = q;
//   }

//   const estadoId = (estado !== undefined && estado !== null && estado !== '') ? toClienteEstadoId(estado) : null;
//   if (estadoId !== null) {
//     where.push(`id_estado = :estado`);
//     params.estado = estadoId;
//   }

//   if (municipio) {
//     where.push(`id_municipio = :mun`);
//     params.mun = Number(municipio);
//   }

//   const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

//   const [rows] = await pool.query(
//     `
//     SELECT SQL_CALC_FOUND_ROWS *
//     FROM TT_CLIENTES
//     ${whereSql}
//     ORDER BY ${sortExpr} ${dir}
//     LIMIT :offset, :pageSize
//     `,
//     { ...params, offset, pageSize }
//   );
//   const [[tot]] = await pool.query('SELECT FOUND_ROWS() AS total');
//   return { items: rows.map(mapRow), total: tot?.total ?? 0, page, pageSize };
// }

// async function obtener(id) {
//   const [rows] = await pool.query(`SELECT * FROM TT_CLIENTES WHERE id = :id`, { id });
//   if (!rows.length) return null;
//   return mapRow(rows[0]);
// }

// async function crear(data) {
//   const sql = `
//     INSERT INTO TT_CLIENTES
//     (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
//      correo, direccion, zona, colonia, id_municipio, id_estado, \`Telefono\`)
//     VALUES
//     (:primer_nombre, :segundo_nombre, :primer_apellido, :segundo_apellido,
//      :correo, :direccion, :zona, :colonia, :id_municipio, :id_estado, :telefono)
//   `;
//   const params = {
//     primer_nombre:   data.primer_nombre,
//     segundo_nombre:  data.segundo_nombre ?? null,
//     primer_apellido: data.primer_apellido,
//     segundo_apellido:data.segundo_apellido ?? null,
//     correo:          data.correo,
//     direccion:       data.direccion ?? null,
//     zona:            data.zona ?? null,
//     colonia:         data.colonia ?? null,
//     id_municipio:    data.id_municipio ?? null,
//     id_estado:       toClienteEstadoId(data.id_estado, CLIENTE_ESTADO_ACTIVO_ID), // default 2
//     telefono:        data.telefono ?? data.Telefono ?? null
//   };
//   const [res] = await pool.query(sql, params);
//   return obtener(res.insertId);
// }

// async function actualizar(id, data) {
//   const set = [];
//   const params = { id };

//   function add(col, param, ...keys) {
//     for (const k of keys) {
//       if (data[k] !== undefined) {
//         set.push(`\`${col}\` = :${param}`);
//         params[param] = data[k];
//         return true;
//       }
//     }
//     return false;
//   }

//   add('primer_nombre',   'primer_nombre',   'primer_nombre');
//   add('segundo_nombre',  'segundo_nombre',  'segundo_nombre');
//   add('primer_apellido', 'primer_apellido', 'primer_apellido');
//   add('segundo_apellido','segundo_apellido','segundo_apellido');
//   add('correo',          'correo',          'correo');
//   add('direccion',       'direccion',       'direccion');
//   add('zona',            'zona',            'zona');
//   add('colonia',         'colonia',         'colonia');
//   add('id_municipio',    'id_municipio',    'id_municipio');

//   if (data.id_estado !== undefined) {
//     set.push('`id_estado` = :id_estado');
//     params.id_estado = toClienteEstadoId(data.id_estado);
//   }

//   add('Telefono',        'telefono',        'telefono', 'Telefono');

//   if (!set.length) return obtener(id);

//   await pool.query(`UPDATE TT_CLIENTES SET ${set.join(', ')} WHERE id = :id`, params);
//   return obtener(id);
// }

// /** Soft delete = id_estado = 3 (Inactivo). Hard delete = DELETE. */
// async function eliminar(id, hard = false) {
//   if (hard) {
//     await pool.query(`DELETE FROM TT_CLIENTES WHERE id = :id`, { id });
//     return { ok: true, hard: true };
//   }
//   await pool.query(
//     `UPDATE TT_CLIENTES SET id_estado = :inac WHERE id = :id`,
//     { id, inac: CLIENTE_ESTADO_INACTIVO_ID } // 3
//   );
//   return { ok: true, hard: false };
// }

// async function stats() {
//   const [[a]] = await pool.query(`SELECT COUNT(*) total FROM TT_CLIENTES`);
//   const [[b]] = await pool.query(
//     `SELECT COUNT(*) activos FROM TT_CLIENTES WHERE id_estado = :act`,
//     { act: CLIENTE_ESTADO_ACTIVO_ID } // 2
//   );
//   return { total: a?.total ?? 0, activos: b?.activos ?? 0 };
// }

// module.exports = { listar, obtener, crear, actualizar, eliminar, stats };
