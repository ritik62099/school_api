

// controllers/authController.js
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateOtp, sendOtpEmail } from '../utils/sendOtp.js';

// 📩 POST /api/auth/request-otp
export const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const existingUser = await User.findOne({ email, isOtpOnly: false });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // purana temp user delete
    await User.deleteOne({ email, isOtpOnly: true });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const tempUser = new User({
      email,
      otp,
      otpExpires,
      isOtpOnly: true,
    });

    await tempUser.save();
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('OTP Request Error:', err);
    res.status(500).json({ message: 'Server error while sending OTP.' });
  }
};

// 👤 POST /api/auth/signup
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      isApproved: false,
      assignedClasses: [],
      assignedSubjects: [],
      canMarkAttendance: false,
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        assignedClasses: user.assignedClasses,
        assignedSubjects: user.assignedSubjects,
        canMarkAttendance: user.canMarkAttendance || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // 🔥 1 din valid
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// 🔑 POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        assignedClasses: user.assignedClasses || [],
        assignedSubjects: user.assignedSubjects || [],
        canMarkAttendance: user.canMarkAttendance || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // 🔥 1 din valid
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// 🙋‍♂️ GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.toObject({ flattenMaps: true }));
  } catch (err) {
    console.error('GetMe Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
