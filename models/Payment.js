// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  month: { 
    type: String, 
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  },
  year: { type: Number, required: true },
  classFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },
  duesCarriedIn: { type: Number, default: 0 }, // balance from previous month
  amountPaid: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: 0 } // can be negative (advance) or positive (dues)
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);