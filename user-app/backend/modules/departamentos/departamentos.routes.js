// backend/src/modules/departamentos/departamentos.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./departamentos.controller');

router.get('/', ctrl.listar);

module.exports = router;
