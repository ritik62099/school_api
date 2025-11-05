// // ES Module syntax only
// import { Router } from 'express';
// import { getAllTeachers, getTeacherCount,approveTeacher ,assignClassSubject, updateAttendanceAccess,deleteTeacher} from '../controllers/teacherController.js';
// // import adminAuth  from '../middleware/adminAuth.js';
// import { auth } from '../middleware/auth.js';
// const router = Router();

// router.get('/count', getTeacherCount);
// router.get('/', getAllTeachers);
// router.patch('/:id/approve', auth, approveTeacher);
// router.patch('/:id/assign', auth, assignClassSubject); // ✅ Fixed
// router.patch('/:id/attendance-access', auth, updateAttendanceAccess); // ✅ Fixed
// router.delete('/:id', auth, deleteTeacher);

// export default router;

// routes/teacherRoutes.js
import { Router } from 'express';
import { 
  getAllTeachers, 
  getTeacherCount,
  approveTeacher,
  assignClassSubject,
  deleteTeacher 
} from '../controllers/teacherController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/count', getTeacherCount);
router.get('/', getAllTeachers);
router.patch('/:id/approve', auth, approveTeacher);
router.patch('/:id/assign', auth, assignClassSubject); // ✅ Now handles everything
router.delete('/:id', auth, deleteTeacher);

// ❌ Remove this line:
// router.patch('/:id/attendance-access', ...);

export default router;