const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');


router.post('/login', controller.login);
router.post('/change-password', controller.changePassword);

module.exports = router;
