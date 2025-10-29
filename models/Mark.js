

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
    pa1: { type: Map, of: Number, default: {} },
    pa2: { type: Map, of: Number, default: {} },
    halfYear: { type: Map, of: Number, default: {} },
    pa3: { type: Map, of: Number, default: {} },
    pa4: { type: Map, of: Number, default: {} },
    final: { type: Map, of: Number, default: {} },
  },
  // 🔽 Keep existing fields
  total: { type: Number, default: 0 },        // raw total (optional)
  percentage: { type: Number, default: 0 },   // raw percentage (optional)

  // ✅ ADD NEW FIELDS FOR WEIGHTED SCHEME
  weightedTotal: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  weightedDetails: {
    type: Map,
    of: {
      term1: Number,
      term2: Number,
      total: Number
    },
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model("Marks", marksSchema);