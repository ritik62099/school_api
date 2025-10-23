// routes/auth.js
import express from 'express';
import { requestOtp, signup, login, getMe } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/request-otp', requestOtp);
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);

export default router;