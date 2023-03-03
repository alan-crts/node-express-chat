const express = require('express');
const { getAllMessage } = require('../controllers/message');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, getAllMessage);

module.exports = router;