

// import Student from '../models/Student.js';
// import cloudinary from '../config/cloudinary.js';
// import User from '../models/User.js';

// export const addStudent = async (req, res) => {
//   try {
//     const {
//       name, fatherName, motherName, class: studentClass,
//       section, rollNo, mobile, address, aadhar, transport, transportFee, dob
//     } = req.body;


//     const studentData = {
//       name, fatherName, motherName, class: studentClass,
//       section, rollNo, mobile, address, aadhar,
//       transport: parseBoolean(transport),
//       transportFee: parseBoolean(transport) ? (Number(transportFee) || null) : null,
//       dob: dob ? new Date(dob) : null,
//     };

//     if (req.file) {
//       try {
//         const fileBase64 = req.file.buffer.toString('base64');
//         const fileUri = `data:${req.file.mimetype};base64,${fileBase64}`;
//         const result = await cloudinary.uploader.upload(fileUri, {
//           folder: 'school/students',
//           width: 300,
//           height: 300,
//           crop: 'fill',
//           gravity: 'face',
//           access_mode: 'public'
//         });
//         studentData.photo = result.secure_url;
//       } catch (err) {
//         console.error('Cloudinary error:', err.message);
//       }
//     }

//     const student = new Student(studentData);
//     await student.save();
//     res.status(201).json(student);
//   } catch (err) {
//     console.error('Student creation error:', err);
//     res.status(400).json({ message: err.message || 'Failed to add student' });
//   }
// };


// // ... (baaki functions unchanged - getAllStudents, etc.)
// export const getAllStudents = async (req, res) => {
//   try {
//     const { class: classFilter } = req.query;
//     const query = {};
//     if (classFilter) {
//       const classes = Array.isArray(classFilter) ? classFilter : [classFilter];
//       query.class = { $in: classes };
//     }
//     const students = await Student.find(query);
//     res.json(students);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };


// export const getStudentsForTeacher = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     // ✅ If user is admin, return all students
//     if (req.user.role === 'admin') {
//       const allStudents = await Student.find().sort({ class: 1, rollNo: 1 });
//       return res.json(allStudents);
//     }

//     // ✅ Find teacher by ID
//     const teacher = await User.findById(req.user.id);
//     if (!teacher) {
//       return res.status(404).json({ message: 'Teacher not found' });
//     }

//     // ✅ Extract assigned classes
//     const assignedClasses =
//       teacher.teachingAssignments?.map((a) => a.class).filter(Boolean) || [];

//     if (assignedClasses.length === 0) {
//       return res.json([]); // no classes
//     }

//     // ✅ Fetch only those students
//     const students = await Student.find({ class: { $in: assignedClasses } }).sort({
//       class: 1,
//       rollNo: 1,
//     });

//     res.json(students);
//   } catch (err) {
//     console.error('❌ Error in getStudentsForTeacher:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


// export const getStudentCount = async (req, res) => {
//   try {
//     const count = await Student.countDocuments();
//     res.json({ count });
//   } catch (err) {
//     console.error('Error fetching student count:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// export const getStudentsByClass = async (req, res) => {
//   try {
//     const result = await Student.aggregate([
//       { $group: { _id: '$class', count: { $sum: 1 } } },
//       { $sort: { _id: 1 } }
//     ]);
//     const byClass = {};
//     result.forEach(item => {
//       const className = item._id || 'Unassigned';
//       byClass[className] = item.count;
//     });
//     res.json(byClass);
//   } catch (err) {
//     console.error('Error fetching students by class:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Delete photo from Cloudinary (optional but recommended)
// // Delete photo from Cloudinary (safer URL parsing)
// const deleteFromCloudinary = async (url) => {
//   if (!url) return;
//   try {
//     // Example URL:
//     // https://res.cloudinary.com/xxx/image/upload/v123456/school/students/abc.jpg

//     // 1) "/upload/" ke baad ka part lo: "v123456/school/students/abc.jpg"
//     const afterUpload = url.split('/upload/')[1];
//     if (!afterUpload) {
//       console.warn('Could not parse Cloudinary URL:', url);
//       return;
//     }

//     // 2) Version (v123456) skip karo -> "school/students/abc.jpg"
//     const withoutVersion = afterUpload.split('/').slice(1).join('/');

//     // 3) Extension hatao -> "school/students/abc"
//     const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

//     await cloudinary.uploader.destroy(publicId);
//   } catch (err) {
//     console.warn('Cloudinary delete failed:', err.message);
//   }
// };

// // Helper function (add at top of controller file)
// const parseBoolean = (val) => {
//   if (typeof val === 'boolean') return val;
//   if (typeof val === 'string') {
//     return val.toLowerCase() === 'true';
//   }
//   return false; // default fallback
// };

// // Inside updateStudent:
// export const updateStudent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       name, fatherName, motherName, class: studentClass,
//       section, rollNo, mobile, address, aadhar, transport, transportFee, dob
//     } = req.body;

//     const existingStudent = await Student.findById(id);
//     if (!existingStudent) {
//       return res.status(404).json({ message: 'Student not found' });
//     }

//     let photoUrl = existingStudent.photo;
//     if (req.file) {
//       try {
//         const fileBase64 = req.file.buffer.toString('base64');
//         const fileUri = `data:${req.file.mimetype};base64,${fileBase64}`;
//         const result = await cloudinary.uploader.upload(fileUri, {
//           folder: 'school/students',
//           width: 300,
//           height: 300,
//           crop: 'fill',
//           gravity: 'face',
//           access_mode: 'public'
//         });
//         photoUrl = result.secure_url;
//         if (existingStudent.photo) {
//           await deleteFromCloudinary(existingStudent.photo);
//         }
//       } catch (err) {
//         console.error('Cloudinary update error:', err.message);
//       }
//     }

//     const updatedData = {
//       name: name || '',
//       fatherName: fatherName || '',
//       motherName: motherName || '',
//       class: studentClass || '',
//       section: section || '',
//       rollNo: rollNo || '',
//       mobile: mobile || '',
//       address: address || '',
//       aadhar: aadhar || '',
//       dob: dob ? new Date(dob) : existingStudent.dob, 
//       transport: parseBoolean(transport),
//       transportFee: parseBoolean(transport) ? (Number(transportFee) || null) : null,
//       photo: photoUrl
//     };

//     const updatedStudent = await Student.findByIdAndUpdate(
//       id,
//       updatedData,
//       { new: true, runValidators: true }
//     );

//     res.json(updatedStudent);
//   } catch (err) {
//     console.error('Update student error:', err);
//     res.status(400).json({ message: err.message || 'Failed to update student' });
//   }
// };

// // 🗑️ DELETE STUDENT
// export const deleteStudent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const student = await Student.findById(id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found' });
//     }

//     // ✅ Delete photo from Cloudinary
//     if (student.photo) {
//       await deleteFromCloudinary(student.photo);
//     }

//     await Student.findByIdAndDelete(id);
//     res.status(200).json({ message: 'Student deleted successfully' });
//   } catch (err) {
//     console.error('Delete student error:', err);
//     res.status(500).json({ message: 'Failed to delete student' });
//   }
// };


// // 👇 ADD THIS FUNCTION
// export const getStudentById = async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found' });
//     }
//     res.json(student);
//   } catch (err) {
//     console.error('Get student by ID error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

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
      name,
      fatherName,
      motherName,
      class: studentClass,
      section,
      rollNo,
      mobile,
      address,
      aadhar,
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
          gravity: 'face',
          access_mode: 'public'
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

// Delete photo from Cloudinary (safer URL parsing)
const deleteFromCloudinary = async (url) => {
  if (!url) return;
  try {
    // Example URL:
    // https://res.cloudinary.com/xxx/image/upload/v123456/school/students/abc.jpg

    // 1) "/upload/" ke baad ka part lo: "v123456/school/students/abc.jpg"
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) {
      console.warn('Could not parse Cloudinary URL:', url);
      return;
    }

    // 2) Version (v123456) skip karo -> "school/students/abc.jpg"
    const withoutVersion = afterUpload.split('/').slice(1).join('/');

    // 3) Extension hatao -> "school/students/abc"
    const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Cloudinary delete failed:', err.message);
  }
};

// Helper function
const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
  return false; // default fallback
};

// 🔹 UPDATE STUDENT (fixed)
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
          gravity: 'face',
          access_mode: 'public'
        });
        photoUrl = result.secure_url;
        if (existingStudent.photo) {
          await deleteFromCloudinary(existingStudent.photo);
        }
      } catch (err) {
        console.error('Cloudinary update error:', err.message);
      }
    }

    // Helper: required fields ko empty na hone do
    const keepOrOld = (val, oldVal) => {
      if (typeof val === 'undefined' || val === '') return oldVal;
      return val;
    };

    const updatedData = {
      // ❗ Ye 5 fields required hain – empty string aayegi to purana value hi rehne do
      name: keepOrOld(name, existingStudent.name),
      fatherName: keepOrOld(fatherName, existingStudent.fatherName),
      address: keepOrOld(address, existingStudent.address),
      section: keepOrOld(section, existingStudent.section),
      rollNo: keepOrOld(rollNo, existingStudent.rollNo),

      // Baaki optional / normal fields
      motherName:
        typeof motherName !== 'undefined'
          ? motherName
          : existingStudent.motherName,

      class:
        typeof studentClass !== 'undefined'
          ? studentClass
          : existingStudent.class,

      mobile:
        typeof mobile !== 'undefined'
          ? mobile
          : existingStudent.mobile,

      aadhar:
        typeof aadhar !== 'undefined'
          ? aadhar
          : existingStudent.aadhar,

      dob: dob ? new Date(dob) : existingStudent.dob,

      transport:
        typeof transport !== 'undefined'
          ? parseBoolean(transport)
          : existingStudent.transport,

      transportFee:
        typeof transport !== 'undefined'
          ? (parseBoolean(transport) ? (Number(transportFee) || null) : null)
          : existingStudent.transportFee,

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

// 👇 GET BY ID
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

// 👇 NEW: PROMOTE STUDENT
export const promoteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { newClass } = req.body;

    if (!newClass) {
      return res.status(400).json({ message: 'newClass is required' });
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // ✅ Sirf class change + rollNo clear
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        $set: { class: newClass },
        $unset: { rollNo: '' }, // field remove karega
      },
      {
        new: true,
        runValidators: false, // yaha required validation skip kar rahe hain
      }
    );

    res.json(updatedStudent);
  } catch (err) {
    console.error('Promote student error:', err);
    res.status(500).json({ message: 'Failed to promote student' });
  }
};
