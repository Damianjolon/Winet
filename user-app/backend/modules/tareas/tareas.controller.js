// backend/modules/tareas/tareas.controller.js
const repo = require('./tareas.repo');

function normalizeFecha(input) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input; // YYYY-MM-DD
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().substring(0, 10);
}

function bad(res, msg, param) {
  return res.status(400).json({ ok: false, errors: [{ msg, param }] });
}

// backend/modules/tareas/tareas.controller.js
async function postTarea(req, res) {
  // ...validaciones y armado de payload...
  try {
    const nueva = await repo.crearTarea({
      titulo,
      descripcion,
      prioridad,
      fecha: fechaNorm,
      estado,
      asignadoA: asignadoNum,
      asignadoANombre
    });
    return res.status(201).json(nueva);
  } catch (e) {
    console.error('[POST /api/tareas] error ->', {
      code: e.code,
      errno: e.errno,
      sqlState: e.sqlState,
      sqlMessage: e.sqlMessage,
      sql: e.sql
    });
    return res.status(500).json({ ok:false, errors:[{ msg:'Error creando tarea' }] });
  }
}

async function getTareas(req, res) {
  const { fecha, asignadoA } = req.query || {};
  if (!fecha) return bad(res, 'Debe enviar ?fecha=YYYY-MM-DD', 'fecha');
  const fechaNorm = normalizeFecha(fecha);
  if (!fechaNorm) return bad(res, 'fecha inválida', 'fecha');

  try {
    const rows = await repo.listarPorDia({ fecha: fechaNorm, asignadoA });
    return res.json(rows);
  } catch (e) {
    console.error('[GET /api/tareas]', e);
    return res.status(500).json({ ok: false, errors: [{ msg: 'Error listando tareas' }] });
  }
}

async function patchEstado(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return bad(res, 'id debe ser numérico', 'id');

  const { estado } = req.body || {};
  if (!['PENDIENTE','EN_PROCESO','COMPLETADA'].includes(estado)) {
    return bad(res, 'estado inválido', 'estado');
  }

  try {
    const upd = await repo.actualizarEstado(id, estado);
    if (!upd) return res.status(404).json({ ok: false, errors: [{ msg: 'Tarea no encontrada' }] });
    return res.json(upd);
  } catch (e) {
    console.error('[PATCH /api/tareas/:id]', e);
    return res.status(500).json({ ok: false, errors: [{ msg: 'Error actualizando estado' }] });
  }
}

module.exports = { postTarea, getTareas, patchEstado };
