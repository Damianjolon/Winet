const express = require('express');
const router = express.Router();
const { getEmpleadoById } = require('../empleados/empleados.controller');
const { crearTarea, listarTareas, actualizarEstado, tableroPorDia } = require('./tareas.repo');

// Helpers
const prioridades = new Set(['BAJA','MEDIA','ALTA']);
const estados = new Set(['PENDIENTE','EN_PROCESO','COMPLETADA']);
const ymd = /^\d{4}-\d{2}-\d{2}$/;

function reqLog(req, _res, next) {
  console.log('[REQ]', req.method, req.originalUrl);
  next();
}
router.use(reqLog);

// POST /api/tareas
router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion = '', prioridad = 'MEDIA', fecha, estado = 'PENDIENTE', asignadoA, asignadoANombre } = req.body;

    if (!titulo || !fecha || !asignadoA || !asignadoANombre) {
      return res.status(400).json({ error: 'FALTAN_CAMPOS', detalle: 'titulo, fecha, asignadoA, asignadoANombre son requeridos' });
    }
    if (!ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA', detalle: 'Usa YYYY-MM-DD' });
    if (!prioridades.has(prioridad)) return res.status(400).json({ error: 'PRIORIDAD_INVALIDA' });
    if (!estados.has(estado)) return res.status(400).json({ error: 'ESTADO_INVALIDO' });

    // Validar empleado y estado
    const empleado = await getEmpleadoById(Number(asignadoA));
    if (!empleado) return res.status(404).json({ error: 'EMPLEADO_NO_ENCONTRADO' });
    if (empleado.estado === 'INACTIVO') {
      return res.status(409).json({ error: 'EMPLEADO_INACTIVO', detalle: 'No se pueden asignar tareas a un empleado INACTIVO' });
    }

    const tarea = await crearTarea({ titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre });
    res.status(201).json(tarea);
  } catch (e) {
    console.error('[POST /tareas] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// GET /api/tareas?fecha=YYYY-MM-DD&asignadoA=9
router.get('/', async (req, res) => {
  try {
    const { fecha, asignadoA } = req.query;
    if (fecha && !ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });
    const lista = await listarTareas({ fecha, asignadoA: asignadoA ? Number(asignadoA) : undefined });
    res.json(lista);
  } catch (e) {
    console.error('[GET /tareas] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// PATCH /api/tareas/:id/estado { estado: 'COMPLETADA' }
router.patch('/:id/estado', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;
    if (!estados.has(estado)) return res.status(400).json({ error: 'ESTADO_INVALIDO' });
    const t = await actualizarEstado(id, estado);
    if (!t) return res.status(404).json({ error: 'TAREA_NO_ENCONTRADA' });
    res.json(t);
  } catch (e) {
    console.error('[PATCH /tareas/:id/estado] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// GET /api/tareas/tablero?fecha=YYYY-MM-DD&asignadoA=9
router.get('/tablero', async (req, res) => {
  try {
    const { fecha, asignadoA } = req.query;
    if (!fecha || !ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });

    const columnas = await tableroPorDia({ fecha, asignadoA: asignadoA ? Number(asignadoA) : undefined });
    res.json({
      fecha,
      asignadoA: asignadoA ? Number(asignadoA) : null,
      columnas
    });
  } catch (e) {
    console.error('[GET /tareas/tablero] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

module.exports = router;
