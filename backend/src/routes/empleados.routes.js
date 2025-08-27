const express = require('express');
const empleadosController = require('../controllers/empleadosController');
const router = require('express').Router();
const { verifyToken, allowRoles } = require('../middleware/auth'); // 👈 esta ruta es desde /routes a /middleware


// Proteger todo el grupo:
router.use(verifyToken);

// Ejemplos:
router.get('/', allowRoles('ADMIN','OPERADOR'), async (req, res) => {
  // listar empleados
});

router.post('/', allowRoles('ADMIN','OPERADOR'), async (req, res) => {
  // crear empleado (puedes seguir usando tu sp_createEmpleado)
});

router.delete('/:id', allowRoles('ADMIN'), async (req, res) => {
  // eliminar
});

module.exports = router;


router.post('/crear', empleadosController.crearEmpleado);
router.get('/listar', empleadosController.obtenerEmpleados);

module.exports = router;
