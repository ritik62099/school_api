
// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Remove: otp, otpExpires, isOtpOnly
  subject: { type: String },
  role: { 
    type: String, 
    enum: ['teacher', 'admin'], 
    default: 'teacher' 
  },
  isApproved: { type: Boolean, default: false },
  assignedClasses: [{ type: String }],
  assignedSubjects: [{ type: String }],
  canMarkAttendance: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('schoolteacher', userSchema);