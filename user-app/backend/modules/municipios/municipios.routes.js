// backend/src/modules/municipios/municipios.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./municipios.controller');

// ¡OJO al orden!
router.get('/', ctrl.listar);                              // /api/municipios?id_departamento=XX
router.get('/por-departamento/:id', ctrl.porDepartamento); // /api/municipios/por-departamento/:id
router.get('/buscar', ctrl.buscar);                        // /api/municipios/buscar?q=
router.get('/:id', ctrl.obtener);                          // /api/municipios/:id
router.post('/crear', ctrl.crear);                         // /api/municipios/crear

module.exports = router;
