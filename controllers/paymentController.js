// src/controllers/paymentController.js
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import ClassFee from '../models/ClassFee.js';
import TransportFee from '../models/TransportFee.js';
import Payment from '../models/Payment.js';

export const getStudentDues = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { months = 1 } = req.query;

    const numMonths = parseInt(months, 10);
    if (isNaN(numMonths) || numMonths < 1 || numMonths > 12) {
      return res.status(400).json({ message: 'Months must be between 1 and 12' });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch fees in parallel
    const [classFeeDoc, transportFeeDoc] = await Promise.all([
      ClassFee.findOne({ className: student.class }),
      student.transport ? TransportFee.findOne({ className: student.class }) : null
    ]);

    const classFee = classFeeDoc?.monthlyFee || 0;
    const transportFee = transportFeeDoc?.monthlyFee || 0;

    const totalClass = classFee * numMonths;
    const totalTransport = transportFee * numMonths;
    const grandTotal = totalClass + totalTransport;

    return res.json({
      studentId: student._id,
      name: student.name,
      class: student.class,
      transport: student.transport,
      months: numMonths,
      fees: {
        class: {
          monthly: classFee,
          total: totalClass
        },
        transport: {
          monthly: transportFee,
          total: totalTransport
        },
        grandTotal
      }
    });
  } catch (err) {
    console.error('Error in getStudentDues:', err);
    return res.status(500).json({ message: 'Failed to calculate student dues' });
  }
};



// src/controllers/paymentController.js

export const recordPayment = async (req, res) => {
    try {
        const { studentId, month, year, amountPaid = 0 } = req.body;

        if (!studentId || !month || !year) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Fetch student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // 1. Get fees and baseDue
        const classFeeDoc = await ClassFee.findOne({ className: student.class });
        const transportFeeDoc = student.transport
            ? await TransportFee.findOne({ className: student.class })
            : null;

        const classFee = classFeeDoc?.monthlyFee || 0;
        const transportFee = transportFeeDoc?.monthlyFee || 0;
        const baseDue = classFee + transportFee; 

        // 2. Get carried balance (lastBalance)
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const targetMonthIndex = months.indexOf(month);
        const targetDate = new Date(year, targetMonthIndex, 1);
        
        // Fetch all payments and sort them by date (Newest first)
        const payments = await Payment.find({ studentId })
            .sort({ year: -1, month: -1 }); // Newest first

        // ✅ FIX: latestPreviousPayment must be defined with 'const'
        const latestPreviousPayment = payments.find(p => { // <--- This line defines the variable
            const pIndex = months.indexOf(p.month);
            if (pIndex === -1) return false;
            const pDate = new Date(p.year, pIndex, 1);
            
            // Find the latest payment that occurred BEFORE the current month.
            return pDate < targetDate; 
        });
        
        const lastBalance = latestPreviousPayment?.balanceAfter || 0; // <--- This line uses it

        // 3. Calculate final amounts
        const totalDue = baseDue + lastBalance;
        const paid = parseFloat(amountPaid) || 0;
        const balanceAfter = totalDue - paid;

        // 4. Save/Update Payment Record
        let payment = await Payment.findOne({ studentId, month, year });
        const isNew = !payment;

        if (isNew) {
            payment = new Payment({
                studentId,
                month,
                year,
                classFee,
                transportFee: student.transport ? transportFee : 0,
                duesCarriedIn: lastBalance,
                amountPaid: paid,
                balanceAfter
            });
        } else {
            payment.classFee = classFee;
            payment.transportFee = student.transport ? transportFee : 0;
            payment.duesCarriedIn = lastBalance;
            payment.amountPaid = paid;
            payment.balanceAfter = balanceAfter;
        }

        await payment.save();

        res.status(200).json({
            message: isNew ? 'Payment recorded successfully' : 'Payment updated successfully',
            payment
        });
    } catch (err) {
        console.error('Payment record error:', err);
        res.status(500).json({ message: 'Failed to record payment' });
    }
};
// In paymentController.js
export const getDues = async (req, res) => {
  try {
    const { studentId } = req.params;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Get base fees
    let classFee = 0, transportFee = 0;
    if (student.class) {
      const classFeeDoc = await ClassFee.findOne({ class: student.class });
      classFee = classFeeDoc ? classFeeDoc.monthly : 0;
    }
    if (student.transport) {
      const transportFeeDoc = await TransportFee.findOne({ class: student.class });
      transportFee = transportFeeDoc ? transportFeeDoc.monthly : 0;
    }
    const baseTotal = classFee + transportFee;

    // Check carry-forward from LAST month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastPayment = await Payment.findOne({ studentId, month: prevMonth, year: prevYear });
    const carryForwardFromLast = lastPayment?.carryForward || 0;

    // Check ADVANCED payment from FUTURE months
    const futurePayments = await Payment.find({
      studentId,
      $or: [
        { year: { $gt: currentYear } },
        { year: currentYear, month: { $gt: currentMonth } }
      ]
    });
    const totalAdvanced = futurePayments.reduce((sum, p) => sum + (p.paidNow || 0), 0);

    // Final dues = base + carryForward - advanced
    let grandTotal = baseTotal + carryForwardFromLast - totalAdvanced;
    if (grandTotal < 0) grandTotal = 0; // Can't be negative

    res.json({
      name: student.name,
      class: student.class,
      section: student.section,
      transport: student.transport,
      fees: {
        class: { monthly: classFee },
        transport: { monthly: transportFee },
        grandTotal,
        baseTotal,
        carryForwardFromLast,
        totalAdvanced
      },
      nextMonthExpected: baseTotal // next month base fee (without carry/advanced)
    });
  } catch (err) {
    console.error('Dues error:', err);
    res.status(500).json({ message: 'Failed to calculate dues' });
  }
};
// controllers/paymentController.js

export const getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 6 } = req.query;

    const history = await Payment.find({ studentId })
      .sort({ year: 1, month: 1 }) // ✅ Oldest first
      .limit(parseInt(limit))
      .lean();

    res.json(history);
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ message: 'Failed to load payment history' });
  }
};