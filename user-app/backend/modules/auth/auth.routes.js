const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const { authRequired } = require('./auth.middleware');

router.post('/login', ctrl.login);
router.get('/me', authRequired, ctrl.me);
router.post('/logout', authRequired, ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

// extra
router.get('/roles', ctrl.getRoles);
router.post('/usuarios', ctrl.createUsuario);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const controller = require('./auth.controller');

// router.post('/login', controller.login);

// module.exports = router;
