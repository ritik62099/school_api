
import User from '../models/User.js';

export const getAllTeachers = async (req, res) => {
  try {
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

// ✅ NEW: Assign per-class subjects + attendance
export const assignClassSubject = async (req, res) => {
  try {
    const { teachingAssignments } = req.body;
    const { id } = req.params;

    // Validation
    if (!Array.isArray(teachingAssignments)) {
      return res.status(400).json({ message: 'teachingAssignments must be an array' });
    }

    for (const item of teachingAssignments) {
      if (!item.class) {
        return res.status(400).json({ message: 'Each assignment must include "class"' });
      }
      if (!Array.isArray(item.subjects)) {
        return res.status(400).json({ message: '"subjects" must be an array' });
      }
      if (typeof item.canMarkAttendance !== 'boolean') {
        return res.status(400).json({ message: '"canMarkAttendance" must be a boolean' });
      }
    }

    const teacher = await User.findByIdAndUpdate(
      id,
      { teachingAssignments },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Assignment updated successfully', teacher });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ❌ REMOVE: updateAttendanceAccess (ab per-class hai, global nahi)

export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
