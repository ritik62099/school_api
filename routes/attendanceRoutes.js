// routes/attendanceRoutes.js
import { Router } from 'express';
import { markAttendance, getAttendanceByDateAndClass,getMonthlyAttendanceReport,getStudentMonthlyAttendance ,getStudentTotalAttendance} from '../controllers/attendanceController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// ✅ POST: Mark/update attendance
router.post('/', auth, markAttendance);

// ✅ GET: Fetch attendance by date & class
router.get('/', auth, getAttendanceByDateAndClass); // ← Ye line missing thi
router.get('/monthly-report', auth, getMonthlyAttendanceReport);
router.get('/student-monthly', auth, getStudentMonthlyAttendance);
router.get('/student-total/:studentId', auth, getStudentTotalAttendance);
export default router;