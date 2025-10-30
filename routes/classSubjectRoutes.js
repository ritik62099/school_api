// backend/routes/classSubjectRoutes.js
import express from 'express';
import * as ctrl from '../controllers/classSubjectController.js';

const router = express.Router();

// Classes
router.get('/classes', ctrl.getAllClasses);
router.post('/classes', ctrl.createClass);

// Subjects
router.get('/subjects', ctrl.getAllSubjects);
router.post('/subjects', ctrl.createSubject);

// Class-Subject Mapping
router.get('/class-subjects', ctrl.getClassSubjectMapping);
router.put('/class-subjects/:className', ctrl.updateClassSubjects);

// DELETE class
router.delete('/classes/:className', ctrl.deleteClass);

// DELETE subject
router.delete('/subjects/:subjectName', ctrl.deleteSubject);

router.put('/classes/:oldName', ctrl.updateClass);   // ✅
router.put('/subjects/:oldName', ctrl.updateSubject); // ✅
// ✅ Ye line sabse important hai:
export default router;