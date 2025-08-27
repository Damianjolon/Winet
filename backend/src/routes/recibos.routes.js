const express = require('express');
const router = express.Router();
const recibosController = require('../controllers/recibosController');

router.post('/recibos/con-detalles', recibosController.crearReciboConDetalles);
router.get('/recibos', recibosController.obtenerRecibos);
router.get('/recibos/:id/detalle', recibosController.obtenerReciboDetalle);

module.exports = router;
