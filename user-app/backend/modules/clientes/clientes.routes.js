const router = require('express').Router();
const ctl = require('./clientes.controller');

// (Opcional) debug para evitar "argument handler must be a function"
const needed = ['listar','ver','crear','editar','eliminar','stats'];
for (const k of needed) {
  if (typeof ctl[k] !== 'function') {
    throw new Error(`[clientes.routes] Falta handler: ${k}. Exportados: ${Object.keys(ctl||{}).join(', ')}`);
  }
}

router.get('/', ctl.listar);
router.get('/stats', ctl.stats);
router.get('/:id', ctl.ver);
router.post('/', ctl.crear);
router.put('/:id', ctl.editar);
router.delete('/:id', ctl.eliminar);

module.exports = router;
