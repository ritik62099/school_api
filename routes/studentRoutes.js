
// routes/studentRoutes.js
import express from 'express';
import multer from 'multer';
import {
  addStudent,
  getAllStudents,
  getStudentsForTeacher,
  getStudentCount,
  getStudentsByClass,
  updateStudent,
  deleteStudent,
  getStudentById,
  promoteStudent,            // ✅ NEW
} from '../controllers/studentController.js';
import { auth } from '../middleware/auth.js';

// ✅ Use memory storage for Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const router = express.Router();

// ✅ Always define STATIC routes before dynamic ones
router.get('/count', auth, getStudentCount);
router.get('/by-class', auth, getStudentsByClass);
router.get('/my-students', auth, getStudentsForTeacher);

// ✅ Promote route (keep before `/:id`)
router.patch('/:id/promote', auth, promoteStudent);

// ✅ Dynamic routes
router.get('/:id', auth, getStudentById);

// ✅ POST/PUT/DELETE
router.post('/', auth, upload.single('photo'), addStudent);
router.put('/:id', auth, upload.single('photo'), updateStudent);
router.delete('/:id', auth, deleteStudent);

// ✅ Finally, the “catch-all” get-all route
router.get('/', auth, getAllStudents);

export default router;
