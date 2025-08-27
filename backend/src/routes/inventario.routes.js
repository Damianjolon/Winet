const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

router.post('/inventario', inventarioController.crearInventario);
router.get('/inventario', inventarioController.obtenerInventario);

module.exports = router;
