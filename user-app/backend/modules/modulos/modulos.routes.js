// /modules/modulos/modulos.routes.js
const express = require('express');
const router = express.Router();
const modulosController = require('./modulos.controller');

router.get('/', modulosController.getModulos);

module.exports = router;
