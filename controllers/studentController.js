

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
    // ✅ Safety check (though middleware should ensure req.user exists)
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const teacherClasses = req.user.assignedClasses || [];

    // ✅ Return empty array instead of 403
    if (teacherClasses.length === 0) {
      return res.json([]); // ← 200 OK with empty list
    }

    const students = await Student.find({ class: { $in: teacherClasses } });
    res.json(students);
  } catch (err) {
    console.error('Error in getStudentsForTeacher:', err);
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

// 🔄 UPDATE STUDENT
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar
    } = req.body;

    // Find existing student
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let photoUrl = existingStudent.photo;

    // Handle new photo upload
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

        // ✅ Delete old photo from Cloudinary (optional)
        if (existingStudent.photo) {
          await deleteFromCloudinary(existingStudent.photo);
        }
      } catch (err) {
        console.error('Cloudinary update error:', err.message);
        // Proceed without new photo if upload fails
      }
    }

    const updatedData = {
      name, fatherName, motherName, class: studentClass,
      section, rollNo, mobile, address, aadhar, photo: photoUrl
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