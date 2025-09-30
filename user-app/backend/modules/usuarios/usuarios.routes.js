const express = require('express');
const router = express.Router();
const C = require('./usuarios.controller');

// Rutas existentes
router.get('/listar', C.getUsuarios);
router.get('/:id', C.getUsuarioPorId);
router.post('/crear', C.createUsuario);
router.put('/cambiar/:id', C.updateUsuario);
router.delete('/eliminar/:id', C.deleteUsuario);

// 🔴 NUEVAS
router.patch('/:id/estado', C.cambiarEstadoUsuario);
router.post('/:id/toggle', C.toggleEstadoUsuario);

// Log de diagnóstico: imprime todas las rutas registradas
console.log('[usuarios.routes] endpoints:',
  router.stack
    .filter(l => l.route)
    .map(l => `${Object.keys(l.route.methods).map(m=>m.toUpperCase()).join(',')} ${l.route.path}`)
);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const usuariosController = require('./usuarios.controller');

// // CRUD Usuarios con verbos claros
// router.get('/listar', usuariosController.getUsuarios);
// router.get('/:id', usuariosController.getUsuarioPorId);
// router.post('/crear', usuariosController.createUsuario);
// router.delete('/eliminar/:id', usuariosController.deleteUsuario);
// router.put('/cambiar/:id', usuariosController.updateUsuario);



// module.exports = router;
