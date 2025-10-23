// routes/attendanceRoutes.js
import { Router } from 'express';
import { markAttendance, getAttendanceByDateAndClass } from '../controllers/attendanceController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// ✅ POST: Mark/update attendance
router.post('/', auth, markAttendance);

// ✅ GET: Fetch attendance by date & class
router.get('/', auth, getAttendanceByDateAndClass); // ← Ye line missing thi

export default router;