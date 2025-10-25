// // models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { 
//     type: String, 
//     required: function() { return !this.isOtpOnly; } 
//   },
//   email: { type: String, required: true, unique: true },
//   password: { 
//     type: String, 
//     required: function() { return !this.isOtpOnly; } 
//   },
//   otp: String,
//   otpExpires: Date,
//   isOtpOnly: { type: Boolean, default: false },
//   subject: { type: String },
//   role: { 
//     type: String, 
//     enum: ['teacher', 'admin'], 
//     default: 'teacher' 
//   },
//   isApproved: { 
//     type: Boolean, 
//     default: false 
//   },
//    assignedClasses: [{ 
//     type: String,
//     // Example: ["10th", "11th"]
//   }],
//   assignedSubjects: [{ 
//     type: String,
//     // Example: ["Mathematics", "Physics"]
//   }],

//   canMarkAttendance: { 
//     type: Boolean, 
//     default: false // By default, no teacher can mark attendance
//   }
// }, { timestamps: true });

// // ✅ CommonJS export
// module.exports = mongoose.model('User', userSchema);
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