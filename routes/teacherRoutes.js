

// routes/teacherRoutes.js
import { Router } from 'express';
import { 
  getAllTeachers, 
  getTeacherCount,
  approveTeacher,
  assignClassSubject,
  deleteTeacher,
  resetTeacherPassword
} from '../controllers/teacherController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/count', getTeacherCount);
router.get('/', getAllTeachers);
router.patch('/:id/approve', auth, approveTeacher);
router.patch('/:id/assign', auth, assignClassSubject);
router.patch('/:id/password', auth, resetTeacherPassword); // ✅ new
router.delete('/:id', auth, deleteTeacher);

export default router;
