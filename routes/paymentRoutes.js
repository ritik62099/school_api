// routes/paymentRoutes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createPayment,
  getPaymentHistory,
  getClassFeeForPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ Create new payment for a month
router.post("/", auth,  createPayment);

// ✅ Get payment history for a student
router.get("/history/:studentId", auth,  getPaymentHistory);

// ✅ Get class fee (for StudentPayment.jsx)
router.get("/class-fees/:className", auth,  getClassFeeForPayment);

export default router;
