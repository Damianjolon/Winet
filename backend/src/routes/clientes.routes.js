// src/routes/clientes.routes.js
const express = require('express');
const clientesController = require('../controllers/clientesController');
const router = require('express').Router();
const { verifyToken, allowRoles } = require('../middleware/auth');

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


router.post('/clientes/crear', clientesController.crearCliente);
router.get('/clientes/listar', clientesController.obtenerClientes); // opcional

module.exports = router;
