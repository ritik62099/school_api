const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOtp, sendOtpEmail } = require('../utils/sendOtp');

// @desc    Request OTP for signup
// @route   POST /api/auth/request-otp
const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const existingUser = await User.findOne({ email, isOtpOnly: false });
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    // Delete any old OTP-only record for this email
    await User.deleteOne({ email, isOtpOnly: true });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

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

// @desc    Signup with OTP verification
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  const { name, email, password, otp } = req.body;
  if (!name || !email || !password || !otp)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp) return res.status(400).json({ message: 'OTP not requested for this email.' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (new Date() > user.otpExpires) return res.status(400).json({ message: 'OTP expired.' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user with real data
    user.name = name;
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isOtpOnly = false;
    user.role = 'teacher'; // default role
    user.isApproved = false; // pending approval
    user.assignedClasses = user.assignedClasses || []; // ensure it's initialized
    user.assignedSubjects = user.assignedSubjects || [];
    await user.save();

    // ✅ Generate JWT with assignedClasses
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        assignedClasses: user.assignedClasses,
        assignedSubjects: user.assignedSubjects,
        canMarkAttendance: user.canMarkAttendance || false
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    // ✅ Generate JWT with assignedClasses
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        assignedClasses: user.assignedClasses || [],
        assignedSubjects: user.assignedSubjects || [],
        canMarkAttendance: user.canMarkAttendance || false
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// @desc Get logged in user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requestOtp, signup, login, getMe };
