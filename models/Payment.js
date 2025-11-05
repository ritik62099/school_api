// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: String,
  className: String,
  section: String,
  month: Number, // e.g. 11 for November
  year: Number,  // e.g. 2025
  classFee: Number,
  transportFee: Number,
  totalAmount: Number,
  amountPaid: Number,
  dueAmount: Number,
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentType: {
    type: String,
    enum: ['demand', 'payment'], // demand bill or payment receipt
    default: 'payment'
  },
  monthsCovered: [String], // e.g. ["September 2025", "October 2025"]
  remarks: String
});

export default mongoose.model('Payment', paymentSchema);
