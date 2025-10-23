// models/Teacher.js
import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  joiningDate: { type: Date, default: Date.now }
});

export default mongoose.model('Teacher', teacherSchema);