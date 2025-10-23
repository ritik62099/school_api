// controllers/teacherController.js
import User from '../models/User.js'; // ✅ Use User model

export const getAllTeachers = async (req, res) => {
  try {
    // ✅ Only get users with role = 'teacher'
    const teachers = await User.find({ role: 'teacher' });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTeacherCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'teacher' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveTeacher = async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update assignClassSubject function
export const assignClassSubject = async (req, res) => {
  try {
    const { assignedClasses, assignedSubjects } = req.body;
    
    // ✅ Validate arrays
    if (!Array.isArray(assignedClasses) || !Array.isArray(assignedSubjects)) {
      return res.status(400).json({ message: 'Classes and subjects must be arrays' });
    }

    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { assignedClasses, assignedSubjects },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Assignment updated', teacher });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add this function
export const updateAttendanceAccess = async (req, res) => {
  try {
    const { canMarkAttendance } = req.body;
    
    if (typeof canMarkAttendance !== 'boolean') {
      return res.status(400).json({ message: 'canMarkAttendance must be boolean' });
    }

    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { canMarkAttendance },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Attendance access updated', teacher });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};