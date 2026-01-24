// const express = require('express');
// const router = express.Router();
// const inventario = require('./inventario.controller');

// // Listar movimientos del kardex
// router.get('/kardex', inventario.getKardex);

// // Insertar nuevo movimiento
// router.post('/movimiento', inventario.addMovimiento);

// // Alertas de productos con stock bajo
// router.get('/alertas', inventario.alertasStock);

// // En inventario.routes.js
// router.get('/productos', inventario.getProductos);


// module.exports = router;

// modules/inventario/inventario.routes.js

const express = require('express');
const router = express.Router();
const inventario = require('./inventario.controller');


router.get('/kardex', inventario.getKardex);
router.post('/movimiento', inventario.addMovimiento);
router.put('/movimiento/:id', inventario.actualizarMovimiento);
router.delete('/movimiento/:id', inventario.eliminarMovimiento);


router.get('/alertas', inventario.alertasStock);
router.get('/dashboard', inventario.dashboard);


router.get('/productos', inventario.getProductos);
router.get('/clientes', inventario.getClientes);

module.exports = router;
