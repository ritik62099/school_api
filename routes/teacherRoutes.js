// ES Module syntax only
import { Router } from 'express';
import { getAllTeachers, getTeacherCount,approveTeacher ,assignClassSubject, updateAttendanceAccess,deleteTeacher} from '../controllers/teacherController.js';
// import adminAuth  from '../middleware/adminAuth.js';
import { auth } from '../middleware/auth.js';
const router = Router();

router.get('/count', getTeacherCount);
router.get('/', getAllTeachers);
router.patch('/approve/:id', auth, approveTeacher);
router.patch('/assign/:id', auth, assignClassSubject);
router.patch('/attendance-access/:id', auth, updateAttendanceAccess);
router.delete('/:id', auth, deleteTeacher);

export default router;