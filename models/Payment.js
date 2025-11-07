// // models/Payment.js
// import mongoose from "mongoose";

// const PaymentSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
//   className: { type: String, required: true },
//   month: { type: String, required: true },
//   year: { type: Number, required: true },
//   tuitionFee: { type: Number, required: true },
//   transportFee: { type: Number, default: 0 },
//   total: { type: Number, required: true },
//   date: { type: Date, default: Date.now },
// });

// export default mongoose.model("Payment", PaymentSchema);


// models/Payment.js
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  className: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  tuitionFee: { type: Number, required: true },
  transportFee: { type: Number, default: 0 },
  total: { type: Number, required: true }, // total = tuition + transport + carry-forward
  amountPaid: { type: Number, default: 0 }, // ✅ NEW: actual amount paid
  remainingBalance: { type: Number, default: 0 }, // ✅ NEW: balance after payment
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", PaymentSchema);