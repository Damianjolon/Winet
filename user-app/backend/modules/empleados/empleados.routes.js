const express = require('express');
const router = express.Router();
const empleadosController = require('./empleados.controller');

// Igual que usuarios, con un GET adicional por id
router.get('/listar', empleadosController.getEmpleados);
router.get('/:id', empleadosController.getEmpleadoById);
// router.post('/crear', empleadosController.createEmpleado);
router.put('/cambiar/:id', empleadosController.updateEmpleado);
router.delete('/eliminar/:id', empleadosController.deleteEmpleado);

module.exports = router;
