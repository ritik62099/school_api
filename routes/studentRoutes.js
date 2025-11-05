

// // routes/studentRoutes.js
// import express from 'express';
// import {
//   addStudent,
//   getAllStudents,
//   getStudentsForTeacher,
//   getStudentCount,
//   getStudentsByClass,
//   updateStudent,
//   deleteStudent,
//   getStudentById
// } from '../controllers/studentController.js';
// import { auth } from '../middleware/auth.js';
// import multer from 'multer';

// // ✅ Use memory storage for Cloudinary
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });



// const router = express.Router();

// // ✅ Static routes FIRST
// router.get('/count', auth, getStudentCount);
// router.get('/by-class', auth, getStudentsByClass);

// // ✅ Dynamic route LAST
// router.get('/my-students', auth, getStudentsForTeacher);
// router.get('/:id', auth, getStudentById);

// // Other routes
// router.post('/', auth, upload.single('photo'), addStudent);
// router.put('/:id', auth, upload.single('photo'), updateStudent);
// router.delete('/:id', auth, deleteStudent);
// router.get('/', auth, getAllStudents);



// export default router;

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
  getStudentById
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

// ✅ Then define dynamic routes AFTER
router.get('/:id', auth, getStudentById);

// ✅ Then POST/PUT/DELETE
router.post('/', auth, upload.single('photo'), addStudent);
router.put('/:id', auth, upload.single('photo'), updateStudent);
router.delete('/:id', auth, deleteStudent);

// ✅ Finally, the “catch-all” get-all route
router.get('/', auth, getAllStudents);

export default router;
