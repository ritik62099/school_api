// models/Exam.js
import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ['PA1', 'PA2', 'Half Yearly', 'PA3', 'PA4', 'Final']
  },
  maxMarks: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true }
});

export default mongoose.model('Exam', examSchema);