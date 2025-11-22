
// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String },
  mobile: { type: String },
  address: { type: String, required: true },
  aadhar: { type: String },
  class: { type: String, required: true },
  section: { type: String, enum: ["A", "B", "C"], required: true },
  rollNo: { type: String, required: true }, // ✅ String as roll numbers may have leading zeros
  photo: { type: String }, // ✅ Cloudinary URL
  transport: { type: Boolean, default: false },
  transportFee: { type: Number, default: null },
  dob: { type: Date },
  admissionDate: { type: Date, default: Date.now }
});

// ✅ ESM ke liye: default export
export default mongoose.model('Student', studentSchema);