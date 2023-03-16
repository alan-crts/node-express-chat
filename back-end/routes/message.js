const express = require('express');
const { getAllMessage, getAllMessageWithSenderAndReceiver, getAllMessageUnreadbyUser, setMessagesRead } = require('../controllers/message');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, getAllMessage);
router.get('/:id', auth, getAllMessageWithSenderAndReceiver);
router.get('/user/unread', auth, getAllMessageUnreadbyUser);
router.put('/user/read/:id', auth, setMessagesRead);

module.exports = router;