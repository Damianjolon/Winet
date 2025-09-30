const router = require('express').Router();
const ctl = require('./clientes.controller');

router.get('/listar/clientes', ctl.listar);
router.get('/ver/clientes/:id', ctl.ver);
router.post('/crear/clientes', ctl.crear);
router.put('/editar/clientes/:id', ctl.editar);
router.delete('/eliminar/clientes/:id', ctl.eliminar);
router.get('/stats/clientes', ctl.stats);

module.exports = router;
