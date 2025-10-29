

// routes/studentRoutes.js
import express from 'express';
import {
  addStudent,
  getAllStudents,
  getStudentsForTeacher,
  getStudentCount,
  getStudentsByClass,
  updateStudent,
  deleteStudent,
  getStudentById
} from '../controllers/studentController.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';

// ✅ Use memory storage for Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});



const router = express.Router();

// ✅ Static routes FIRST
router.get('/count', auth, getStudentCount);
router.get('/by-class', auth, getStudentsByClass);

// ✅ Dynamic route LAST
router.get('/my-students', auth, getStudentsForTeacher);
router.get('/:id', auth, getStudentById);

// Other routes
router.post('/', auth, upload.single('photo'), addStudent);
router.put('/:id', auth, upload.single('photo'), updateStudent);
router.delete('/:id', auth, deleteStudent);
router.get('/', auth, getAllStudents);



export default router;