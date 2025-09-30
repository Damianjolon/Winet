const express = require('express');
const router = express.Router();

const { obtenerEmpleadoPorId } = require('../empleados/empleados.repo');
const {
  crearAsignacion,
  listarAsignaciones,
  actualizarEstado,
  tableroPorDia,
  listarTodas,
  eliminarAsignacion,
} = require('./asignaciones.repo');

const prioridades     = new Set(['BAJA','MEDIA','ALTA']);
const estadosCreacion = new Set(['PENDIENTE','EN_PROCESO','COMPLETADA']);              // POST
const estadosPatch    = new Set(['PENDIENTE','EN_PROCESO','COMPLETADA','FINALIZADA']); // PATCH
const ymd = /^\d{4}-\d{2}-\d{2}$/;

router.use((req, _res, next) => { console.log('[REQ]', req.method, req.originalUrl); next(); });

// POST /api/asignaciones
router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion = '', prioridad = 'MEDIA', fecha, estado = 'PENDIENTE', asignadoA, asignadoANombre } = req.body;
    if (!titulo || !fecha || !asignadoA || !asignadoANombre) {
      return res.status(400).json({ error: 'FALTAN_CAMPOS' });
    }
    if (!ymd.test(fecha))             return res.status(400).json({ error: 'FECHA_INVALIDA' });
    if (!prioridades.has(prioridad))  return res.status(400).json({ error: 'PRIORIDAD_INVALIDA' });
    if (!estadosCreacion.has(estado)) return res.status(400).json({ error: 'ESTADO_INVALIDO' });

    const emp = await obtenerEmpleadoPorId(Number(asignadoA));
    if (!emp)                         return res.status(404).json({ error: 'EMPLEADO_NO_ENCONTRADO' });
    if (emp.estado === 'INACTIVO')    return res.status(409).json({ error: 'EMPLEADO_INACTIVO' });

    const tarea = await crearAsignacion({ titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre });
    res.status(201).json(tarea);
  } catch (e) {
    console.error('[POST /asignaciones] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// GET /api/asignaciones
router.get('/', async (req, res) => {
  try {
    const { fecha, asignadoA } = req.query;
    if (fecha && !ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });
    const lista = await listarAsignaciones({ fecha, asignadoA: asignadoA ? Number(asignadoA) : undefined });
    res.json(lista);
  } catch (e) {
    console.error('[GET /asignaciones] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// PATCH /api/asignaciones/:id/estado  — ACTUALIZA (no borra)
router.patch('/:id/estado', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;
    console.log('[PATCH estado]', { id, body: req.body });

    if (!estado)                    return res.status(400).json({ error: 'FALTAN_CAMPOS' });
    if (!estadosPatch.has(estado))  return res.status(400).json({ error: 'ESTADO_INVALIDO' });

    const t = await actualizarEstado(id, estado);
    if (!t)                         return res.status(404).json({ error: 'ASIGNACION_NO_ENCONTRADA' });
    res.json(t);
  } catch (e) {
    console.error('[PATCH /asignaciones/:id/estado] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// DELETE /api/asignaciones/:id — borra definitivo
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID_INVALIDO' });

    console.log('[DELETE /asignaciones/:id]', id);
    const ok = await eliminarAsignacion(id);
    return ok ? res.status(204).send()
              : res.status(404).json({ error: 'ASIGNACION_NO_ENCONTRADA' });
  } catch (e) {
    console.error('[DELETE /asignaciones/:id] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// GET /api/asignaciones/tablero
router.get('/tablero', async (req, res) => {
  try {
    const { fecha, asignadoA } = req.query;
    if (!fecha || !ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });

    const columnas = await tableroPorDia({ fecha, asignadoA: asignadoA ? Number(asignadoA) : undefined });
    res.json({ fecha, asignadoA: asignadoA ? Number(asignadoA) : null, columnas });
  } catch (e) {
    console.error('[GET /asignaciones/tablero] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

// GET /api/asignaciones/listar
router.get('/listar', async (req, res) => {
  try {
    const { desde, hasta, estado, asignadoA, q } = req.query;
    const data = await listarTodas({ desde, hasta, estado, asignadoA, q });
    res.json(data);
  } catch (e) {
    console.error('[GET /asignaciones/listar] Error:', e);
    res.status(500).json({ error: 'ERROR_SERVIDOR' });
  }
});

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const { obtenerEmpleadoPorId } = require('../empleados/empleados.repo');
// const {
//   crearAsignacion,
//   listarAsignaciones,
//   actualizarEstado,
//   tableroPorDia,
//   listarTodas,
//   eliminarAsignacion,
// } = require('./asignaciones.repo');

// const prioridades = new Set(['BAJA','MEDIA','ALTA']);
// const estadosCreacion = new Set(['PENDIENTE','EN_PROCESO','COMPLETADA']);
// const estadosPatch    = new Set(['PENDIENTE','EN_PROCESO','COMPLETADA','FINALIZADA']);
// const ymd = /^\d{4}-\d{2}-\d{2}$/;

// router.use((req, _res, next) => { console.log('[REQ]', req.method, req.originalUrl); next(); });

// // POST /api/asignaciones
// router.post('/', async (req, res) => {
//   try {
//     const { titulo, descripcion = '', prioridad = 'MEDIA', fecha, estado = 'PENDIENTE', asignadoA, asignadoANombre } = req.body;

//     if (!titulo || !fecha || !asignadoA || !asignadoANombre) {
//       return res.status(400).json({ error: 'FALTAN_CAMPOS', detalle: 'titulo, fecha, asignadoA, asignadoANombre son requeridos' });
//     }
//     if (!ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });
//     if (!prioridades.has(prioridad)) return res.status(400).json({ error: 'PRIORIDAD_INVALIDA' });
//     if (!estadosCreacion.has(estado)) return res.status(400).json({ error: 'ESTADO_INVALIDO' });

//     const empleado = await obtenerEmpleadoPorId(Number(asignadoA));
//     if (!empleado) return res.status(404).json({ error: 'EMPLEADO_NO_ENCONTRADO' });
//     if (empleado.estado === 'INACTIVO') {
//       return res.status(409).json({ error: 'EMPLEADO_INACTIVO', detalle: 'No se pueden asignar tareas a un empleado INACTIVO' });
//     }

//     const tarea = await crearAsignacion({ titulo, descripcion, prioridad, fecha, estado, asignadoA, asignadoANombre });
//     res.status(201).json(tarea);
//   } catch (e) {
//     console.error('[POST /asignaciones] Error:', e);
//     res.status(500).json({ error: 'ERROR_SERVIDOR' });
//   }
// });

// // GET /api/asignaciones
// router.get('/', async (req, res) => {
//   try {
//     const { fecha, asignadoA } = req.query;
//     if (fecha && !ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });
//     const lista = await listarAsignaciones({ fecha, asignadoA: asignadoA ? Number(asignadoA) : undefined });
//     res.json(lista);
//   } catch (e) {
//     console.error('[GET /asignaciones] Error:', e);
//     res.status(500).json({ error: 'ERROR_SERVIDOR' });
//   }
// });

// // PATCH /api/asignaciones/:id/estado  (incluye FINALIZADA, sin borrar)
// router.patch('/:id/estado', async (req, res) => {
//   try {
//     const id = Number(req.params.id);
//     const { estado } = req.body;
//     if (!estadosPatch.has(estado)) return res.status(400).json({ error: 'ESTADO_INVALIDO' });

//     const t = await actualizarEstado(id, estado); // <-- solo actualiza
//     if (!t) return res.status(404).json({ error: 'ASIGNACION_NO_ENCONTRADA' });
//     res.json(t);
//   } catch (e) {
//     console.error('[PATCH /asignaciones/:id/estado] Error:', e);
//     res.status(500).json({ error: 'ERROR_SERVIDOR' });
//   }
// });

// // DELETE /api/asignaciones/:id  (borrado definitivo)
// router.delete('/:id', async (req, res) => {
//   try {
//     const ok = await eliminarAsignacion(Number(req.params.id));
//     return ok ? res.status(204).send() : res.status(404).json({ error: 'ASIGNACION_NO_ENCONTRADA' });
//   } catch (e) {
//     console.error('[DELETE /asignaciones/:id] Error:', e);
//     res.status(500).json({ error: 'ERROR_SERVIDOR' });
//   }
// });

// // GET /api/asignaciones/tablero
// router.get('/tablero', async (req, res) => {
//   try {
//     const { fecha, asignadoA } = req.query;
//     if (!fecha || !ymd.test(fecha)) return res.status(400).json({ error: 'FECHA_INVALIDA' });
//     const columnas = await tableroPorDia({ fecha, asignadoA: asignadoA ? Number(asignadoA) : undefined });
//     res.json({ fecha, asignadoA: asignadoA ? Number(asignadoA) : null, columnas });
//   } catch (e) {
//     console.error('[GET /asignaciones/tablero] Error:', e);
//     res.status(500).json({ error: 'ERROR_SERVIDOR' });
//   }
// });

// // GET /api/asignaciones/listar
// router.get('/listar', async (req, res) => {
//   try {
//     const { desde, hasta, estado, asignadoA, q } = req.query;
//     const data = await listarTodas({ desde, hasta, estado, asignadoA, q });
//     res.json(data);
//   } catch (e) {
//     console.error('[GET /asignaciones/listar] Error:', e);
//     res.status(500).json({ error: 'ERROR_SERVIDOR' });
//   }
// });

// module.exports = router;
