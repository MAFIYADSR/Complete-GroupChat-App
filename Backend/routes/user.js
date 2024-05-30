const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

router.post('/sign-up', userController.createUser);

router.post('/login', userController.checkUser)

module.exports = router;