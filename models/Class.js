// backend/models/Class.js
import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

// ESM me: model ko default export karein
export default mongoose.model('Class', classSchema);