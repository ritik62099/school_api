// routes/auth.js
const express = require('express');
const { requestOtp, signup, login,getMe } = require('../controllers/authController');
const {auth} = require('../middleware/auth');

const router = express.Router();

router.post('/request-otp', requestOtp);
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);

module.exports = router;