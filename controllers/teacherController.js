

// controllers/teacherController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getAllTeachers = async (req, res) => {
  try {
    // ❗ password ko kabhi front-end pe mat bhejo
    const teachers = await User.find({ role: 'teacher' }).select('-password');
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
    ).select('-password');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ NEW: Reset / change password (admin)
export const resetTeacherPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashed },
      { new: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Password reset successfully', teacher });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignClassSubject = async (req, res) => {
  try {
    const { teachingAssignments } = req.body;
    const { id } = req.params;

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
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Assignment updated successfully', teacher });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

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
