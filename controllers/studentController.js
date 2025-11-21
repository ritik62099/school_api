

import Student from '../models/Student.js';
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';

export const addStudent = async (req, res) => {
  try {
    const {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar, transport, transportFee, dob
    } = req.body;


    const studentData = {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar,
      transport: parseBoolean(transport),
      transportFee: parseBoolean(transport) ? (Number(transportFee) || null) : null,
      dob: dob ? new Date(dob) : null,
    };

    if (req.file) {
      try {
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
      } catch (err) {
        console.error('Cloudinary error:', err.message);
      }
    }

    const student = new Student(studentData);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error('Student creation error:', err);
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
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ If user is admin, return all students
    if (req.user.role === 'admin') {
      const allStudents = await Student.find().sort({ class: 1, rollNo: 1 });
      return res.json(allStudents);
    }

    // ✅ Find teacher by ID
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // ✅ Extract assigned classes
    const assignedClasses =
      teacher.teachingAssignments?.map((a) => a.class).filter(Boolean) || [];

    if (assignedClasses.length === 0) {
      return res.json([]); // no classes
    }

    // ✅ Fetch only those students
    const students = await Student.find({ class: { $in: assignedClasses } }).sort({
      class: 1,
      rollNo: 1,
    });

    res.json(students);
  } catch (err) {
    console.error('❌ Error in getStudentsForTeacher:', err);
    res.status(500).json({ message: 'Server error' });
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

// Delete photo from Cloudinary (optional but recommended)
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    const parts = publicId.split('/');
    const publicIdFromUrl = parts[parts.length - 2] + '/' + parts[parts.length - 1].split('.')[0];
    await cloudinary.uploader.destroy(publicIdFromUrl);
  } catch (err) {
    console.warn('Cloudinary delete failed:', err.message);
  }
};
// Helper function (add at top of controller file)
const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
  return false; // default fallback
};

// Inside updateStudent:
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar, transport, transportFee, dob
    } = req.body;

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let photoUrl = existingStudent.photo;
    if (req.file) {
      try {
        const fileBase64 = req.file.buffer.toString('base64');
        const fileUri = `data:${req.file.mimetype};base64,${fileBase64}`;
        const result = await cloudinary.uploader.upload(fileUri, {
          folder: 'school/students',
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face'
        });
        photoUrl = result.secure_url;
        if (existingStudent.photo) {
          await deleteFromCloudinary(existingStudent.photo);
        }
      } catch (err) {
        console.error('Cloudinary update error:', err.message);
      }
    }

    const updatedData = {
      name: name || '',
      fatherName: fatherName || '',
      motherName: motherName || '',
      class: studentClass || '',
      section: section || '',
      rollNo: rollNo || '',
      mobile: mobile || '',
      address: address || '',
      aadhar: aadhar || '',
      dob: dob ? new Date(dob) : existingStudent.dob, 
      transport: parseBoolean(transport),
      transportFee: parseBoolean(transport) ? (Number(transportFee) || null) : null,
      photo: photoUrl
    };

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.json(updatedStudent);
  } catch (err) {
    console.error('Update student error:', err);
    res.status(400).json({ message: err.message || 'Failed to update student' });
  }
};

// 🗑️ DELETE STUDENT
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // ✅ Delete photo from Cloudinary
    if (student.photo) {
      await deleteFromCloudinary(student.photo);
    }

    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Failed to delete student' });
  }
};


// 👇 ADD THIS FUNCTION
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error('Get student by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};