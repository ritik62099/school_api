// controllers/paymentController.js
import Payment from "../models/Payment.js";
import ClassFee from "../models/ClassFee.js";
import Student from "../models/Student.js";



/**
 * ✅ Get Payment History of a Student
 * GET /api/payments/history/:studentId
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const payments = await Payment.find({ studentId }).sort({ year: -1, month: 1 });
    res.json(payments);
  } catch (err) {
    console.error("Payment history error:", err);
    res.status(500).json({ message: "Server error fetching payment history." });
  }
};

/**
 * ✅ Get Class Fee for StudentPayment.jsx
 * GET /api/payments/class-fees/:className
 */
export const getClassFeeForPayment = async (req, res) => {
  try {
    const className = req.params.className;
    const fee = await ClassFee.findOne({ className });
    if (!fee) return res.status(404).json({ message: "Class fee not found." });
    res.json(fee);
  } catch (err) {
    console.error("Class fee fetch error:", err);
    res.status(500).json({ message: "Server error fetching class fee." });
  }
};


// controllers/paymentController.js
export const createPayment = async (req, res) => {
  try {
    const { 
      studentId, 
      className, 
      month, 
      year, 
      tuitionFee, 
      transportFee, 
      total, 
      amountPaid,          // ✅ NEW
      remainingBalance,    // ✅ NEW
      date 
    } = req.body;

    if (!studentId || !month || !year || amountPaid == null) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existing = await Payment.findOne({ studentId, month, year });
    if (existing) {
      return res.status(400).json({ message: "Payment already exists for this month." });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });

    const payment = await Payment.create({
      studentId,
      className,
      month,
      year,
      tuitionFee,
      transportFee,
      total,
      amountPaid: amountPaid || 0,          // ✅ Save
      remainingBalance: remainingBalance || 0, // ✅ Save
      date: date || new Date(),
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error("Payment create error:", err);
    res.status(500).json({ message: "Server error while creating payment." });
  }
};