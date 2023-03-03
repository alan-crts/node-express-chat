const express = require('express');
const { getAllMessage, getAllMessageWithSenderAndReceiver } = require('../controllers/message');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, getAllMessage);
router.get('/:id', auth, getAllMessageWithSenderAndReceiver);

module.exports = router;