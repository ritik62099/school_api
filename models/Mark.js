import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  class: { type: String, required: true },
  exams: {
    pa1: { type: Map, of: Number, default: {} },
    pa2: { type: Map, of: Number, default: {} },
    halfYear: { type: Map, of: Number, default: {} },
    pa3: { type: Map, of: Number, default: {} },
    pa4: { type: Map, of: Number, default: {} },
    final: { type: Map, of: Number, default: {} },
  },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
});

export default mongoose.model("Marks", marksSchema);
