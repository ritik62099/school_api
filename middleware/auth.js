import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp -otpExpires');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      assignedClasses: user.assignedClasses || [],
      assignedSubjects: user.assignedSubjects || [],
      canMarkAttendance: user.canMarkAttendance || false
    };

    next();
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid token' });
  }
};
