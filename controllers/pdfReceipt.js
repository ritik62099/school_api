// controllers/pdfReceipt.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Student from "../models/Student.js";
import Payment from "../models/Payment.js";

export const generateReceiptPDF = async (req, res) => {
  try {
    const { type, studentId } = req.query;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 40 });
    const filename = `${student.name}-${type}-receipt.pdf`;
    const filepath = path.join("receipts", filename);

    // Ensure receipts directory exists
    if (!fs.existsSync("receipts")) fs.mkdirSync("receipts");

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // === HEADER ===
    doc
      .fontSize(20)
      .text("AMBICA INTERNATIONAL SCHOOL", { align: "center" })
      .moveDown(0.2);
    doc
      .fontSize(10)
      .text("N.H.-19, Main Road, Saidpur, Dighwara, Saran", {
        align: "center",
      })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .text(
        type === "demand"
          ? "📘 DEMAND BILL"
          : "💳 PAYMENT RECEIPT",
        { align: "center" }
      )
      .moveDown(0.8);

    // === STUDENT DETAILS ===
    doc.fontSize(11);
    doc.text(`Name: ${student.name}`);
    doc.text(`Father's Name: ${student.fatherName || "-"}`);
    doc.text(`Class: ${student.class}  |  Section: ${student.section}`);
    doc.text(`Aadhar No: ${student.aadhar || "-"}`);
    doc.moveDown(0.5);
    doc.text("-------------------------------------------------------");
    doc.moveDown(0.5);

    // === FEE DETAILS ===
    if (type === "demand") {
      doc.fontSize(12).text("🧾 Fee Details (Demand):");
      doc.moveDown(0.5);

      doc.fontSize(10);
      doc.text(`Class Fee: ₹${student.classFee || "N/A"}`);
      if (student.transport)
        doc.text(`Transport Fee: ₹${student.transportFee || "N/A"}`);
      doc.moveDown(0.5);
      doc.text(`Total Payable: ₹(calculated total)`);
      doc.text(`Due Months: (list from backend)`);

      doc.moveDown(1);
      doc.fontSize(9).text(
        "Note: Please clear your dues by the 10th of every month.",
        { align: "center" }
      );
    } else {
      // Payment Receipt
      const payment = await Payment.findOne({ studentId })
        .sort({ paymentDate: -1 })
        .lean();

      doc.fontSize(12).text("💳 Payment Summary:");
      doc.moveDown(0.5);

      if (payment) {
        doc.fontSize(10);
        doc.text(`Paid Amount: ₹${payment.amountPaid}`);
        doc.text(`Total Fee: ₹${payment.totalAmount}`);
        doc.text(`Remaining Due: ₹${payment.dueAmount}`);
        doc.text(`Months Covered: ${payment.monthsCovered.join(", ")}`);
        doc.text(`Payment Date: ${new Date(payment.paymentDate).toDateString()}`);
      } else {
        doc.text("No payment record found for this student.");
      }

      doc.moveDown(1);
      doc.fontSize(9).text(
        "Thank you for your payment!",
        { align: "center" }
      );
    }

    doc.end();

    // When PDF is ready → send file
    stream.on("finish", () => {
      res.download(filepath, filename, (err) => {
        if (err) console.error("Error sending file:", err);
      });
    });
  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
