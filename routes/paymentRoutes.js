// routes/paymentRoutes.js
import express from "express";
import { generateDemandBill, recordPayment } from "../controllers/paymentController.js";
import { generateReceiptPDF } from "../controllers/pdfReceipt.js";
import {auth} from "../middleware/auth.js";

const router = express.Router();

router.post("/generate-demand", auth, generateDemandBill);
router.post("/record-payment", auth, recordPayment);
router.get("/generate-pdf", auth, generateReceiptPDF);

export default router;
