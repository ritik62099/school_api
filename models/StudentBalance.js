import mongoose from 'mongoose';

const studentBalanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  totalPaid: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 },
  lastCalculatedMonth: { type: String, required: true }, // <-- Required field
});

export default mongoose.model('StudentBalance', studentBalanceSchema);
