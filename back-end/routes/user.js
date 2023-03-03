const express = require('express');
const { getSelf, getOneUser } = require('../controllers/user');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/self', auth, getSelf);
router.get('/:id', auth, getOneUser);

module.exports = router;