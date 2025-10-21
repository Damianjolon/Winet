// backend/modules/auth/users.routes.js
const express = require('express');
const router = express.Router();

// ✅ SOLO UNA VEZ. Y ojo al nombre del archivo: "usuarios.controller.js"
const ctrl = require('./usuarios.controller');

router.get('/roles', ctrl.getRoles);
router.post('/', ctrl.createUsuario);

module.exports = router;
