

import Student from '../models/Student.js';
import cloudinary from '../config/cloudinary.js';

export const addStudent = async (req, res) => {
  try {
    const {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar
    } = req.body;

    const studentData = {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar
    };

    // ✅ UPLOAD PHOTO
    if (req.file) {
      try {
        // Convert buffer to base64
        const fileBase64 = req.file.buffer.toString('base64');
        const fileUri = `data:${req.file.mimetype};base64,${fileBase64}`;

        const result = await cloudinary.uploader.upload(fileUri, {
          folder: 'school/students',
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face'
        });

        studentData.photo = result.secure_url;
        // console.log('✅ Photo URL saved:', result.secure_url);
      } catch (err) {
        // console.error('❌ Cloudinary error:', err.message);
        // Don't block student creation if photo fails
      }
    }

    const student = new Student(studentData);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    // console.error('❌ Student creation error:', err);
    res.status(400).json({ message: err.message || 'Failed to add student' });
  }
};



// ... (baaki functions unchanged - getAllStudents, etc.)
export const getAllStudents = async (req, res) => {
  try {
    const { class: classFilter } = req.query;
    const query = {};
    if (classFilter) {
      const classes = Array.isArray(classFilter) ? classFilter : [classFilter];
      query.class = { $in: classes };
    }
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentsForTeacher = async (req, res) => {
  try {

    const teacherClasses = req.user.assignedClasses;
   

    if (!teacherClasses || teacherClasses.length === 0) {
      return res.status(403).json({ message: "No assigned classes" });
    }

    const students = await Student.find({ class: { $in: teacherClasses } });
    
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getStudentCount = async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error fetching student count:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const result = await Student.aggregate([
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const byClass = {};
    result.forEach(item => {
      const className = item._id || 'Unassigned';
      byClass[className] = item.count;
    });
    res.json(byClass);
  } catch (err) {
    console.error('Error fetching students by class:', err);
    res.status(500).json({ message: 'Server error' });
  }
};