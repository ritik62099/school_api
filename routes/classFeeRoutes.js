import express from 'express';
import {
  getAllClassFees,
  setClassFee,
  updateClassFee,
  deleteClassFee
} from '../controllers/classFeeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth,getAllClassFees);
router.post('/', auth,setClassFee);
router.put('/:className', auth,updateClassFee);
router.delete('/:className', auth,deleteClassFee);

export default router;