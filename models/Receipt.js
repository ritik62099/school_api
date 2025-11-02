import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  receiptNo: {
    type: Number,
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: { type: String, required: true },
  fatherName: { type: String },
  className: { type: String },
  section: { type: String },
  roll: { type: String },
  month: { type: String }, // "2025-11"
  date: { type: Date, default: Date.now },
  fees: {
    tuitionFee: { type: Number },
    transportFee: { type: Number },
    registrationFee: { type: Number },
    admissionFee: { type: Number },
    annualFee: { type: Number },
    backDues: { type: Number },
    lateFine: { type: Number },
    others: { type: Number }
  },
  total: { type: Number },
  paid: { type: Number },
  dues: { type: Number },
  note: { type: String, default: "" }
}, {
  timestamps: true
});

// Auto-increment receiptNo
receiptSchema.pre('save', async function(next) {
  if (!this.isNew) return next();

  const lastReceipt = await this.constructor.findOne().sort({ receiptNo: -1 });
  this.receiptNo = (lastReceipt?.receiptNo || 0) + 1;
  next();
});

export default mongoose.model('Receipt', receiptSchema);