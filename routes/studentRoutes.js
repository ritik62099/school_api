// // routes/studentRoutes.js
// import express from 'express';
// import {
//   addStudent,
//   getAllStudents,
//   getStudentsForTeacher,
//   getStudentCount,
//   getStudentsByClass
// } from '../controllers/studentController.js';
// import { auth } from '../middleware/auth.js';
// import multer from 'multer'; // ✅ Add multer

// // ✅ Configure multer (store in memory, 5MB limit)
// const upload = multer({
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5 MB
//   }
// });

// const router = express.Router();

// // ✅ Add upload middleware only for POST /students
// router.post('/', auth, upload.single('photo'), addStudent);

// router.get('/', auth, getAllStudents);
// router.get('/my-students', auth, getStudentsForTeacher);
// router.get('/count', auth, getStudentCount);
// router.get('/by-class', auth, getStudentsByClass);

// export default router;

// routes/studentRoutes.js
import express from 'express';
import {
  addStudent,
  getAllStudents,
  getStudentsForTeacher,
  getStudentCount,
  getStudentsByClass
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

router.post('/', auth, upload.single('photo'), addStudent);
router.get('/', auth, getAllStudents);
router.get('/my-students', auth, getStudentsForTeacher);
router.get('/count', auth, getStudentCount);
router.get('/by-class', auth, getStudentsByClass);

export default router;