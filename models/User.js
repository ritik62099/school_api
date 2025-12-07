

// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

  teachingAssignments: [
    {
      class: { type: String, required: true },
      subjects: [{ type: String }],
      canMarkAttendance: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

// Password hash karne ka hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// findByIdAndUpdate use karte waqt alag se hash karna padega (neeche controller me)
export default mongoose.model('schoolteacher', userSchema);
