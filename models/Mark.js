


// models/Mark.js
import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student", 
    required: true 
  },
  class: { type: String, required: true },
  exams: {
    pa1: { type: mongoose.Schema.Types.Mixed, default: {} },
    pa2: { type: mongoose.Schema.Types.Mixed, default: {} },
    halfYear: { type: mongoose.Schema.Types.Mixed, default: {} },
    pa3: { type: mongoose.Schema.Types.Mixed, default: {} },
    pa4: { type: mongoose.Schema.Types.Mixed, default: {} },
    final: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  weightedTotal: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  weightedDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

marksSchema.index({ studentId: 1 }, { unique: true });

export default mongoose.model("Marks", marksSchema);