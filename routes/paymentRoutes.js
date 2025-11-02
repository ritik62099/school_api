// src/routes/payments.js
import express from 'express';
import { recordPayment,getPaymentHistory} from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Your existing routes (list, create, etc.) go here...

// NEW: Get student dues with ?months=N

router.post('/', auth, recordPayment);
router.get('/history/:studentId', auth, getPaymentHistory);

export default router;