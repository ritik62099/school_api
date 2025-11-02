// routes/transportFees.js
import express from 'express';
import {
  getAllTransportFees,
  setTransportFee,
  updateTransportFee,
  deleteTransportFee
} from '../controllers/transportFeeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getAllTransportFees);
router.post('/', auth, setTransportFee);
router.put('/:className', auth, updateTransportFee);   // ✅ FIXED
router.delete('/:className', auth, deleteTransportFee); // ✅ FIXED

export default router;
