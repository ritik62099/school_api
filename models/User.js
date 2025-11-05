
// // models/User.js
// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   // Remove: otp, otpExpires, isOtpOnly
//   subject: { type: String },
//   role: { 
//     type: String, 
//     enum: ['teacher', 'admin'], 
//     default: 'teacher' 
//   },
//   isApproved: { type: Boolean, default: false },
//   assignedClasses: [{ type: String }],
//   assignedSubjects: [{ type: String }],
//   canMarkAttendance: { type: Boolean, default: false }
// }, { timestamps: true });

// export default mongoose.model('schoolteacher', userSchema);
// models/User.js


import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['teacher', 'admin'], 
    default: 'teacher' 
  },
  isApproved: { type: Boolean, default: false },
  
  // ✅ REPLACE old fields with new per-class structure
  teachingAssignments: [
    {
      class: { type: String, required: true },
      subjects: [{ type: String }],
      canMarkAttendance: { type: Boolean, default: false }
    }
  ]
  
  // ❌ Remove these old fields:
  // assignedClasses, assignedSubjects, canMarkAttendance (global)
}, { timestamps: true });

export default mongoose.model('schoolteacher', userSchema);