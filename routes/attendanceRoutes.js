// routes/attendanceRoutes.js
import { Router } from 'express';
import {
  markAttendance,
  getAttendanceByDateAndClass,
  getMonthlyAttendanceReport,
  getStudentMonthlyAttendance,
  getStudentTotalAttendance,
  getSchoolDailySummary,   
} from '../controllers/attendanceController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/', auth, markAttendance);
router.get('/', auth, getAttendanceByDateAndClass);
router.get('/monthly-report', auth, getMonthlyAttendanceReport);
router.get('/student-monthly', auth, getStudentMonthlyAttendance);
router.get('/student-total/:studentId', auth, getStudentTotalAttendance);
router.get('/school-summary', auth, getSchoolDailySummary);

export default router;
