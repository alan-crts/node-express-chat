const express = require('express');
const { getSelf } = require('../controllers/user');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/self', auth, getSelf);

module.exports = router;