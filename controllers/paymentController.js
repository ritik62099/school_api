// controllers/paymentController.js
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import ClassFee from '../models/ClassFee.js';
import dayjs from 'dayjs';

export const generateDemandBill = async (req, res) => {
  try {
    const { studentId, month, year } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const classFeeDoc = await ClassFee.findOne({ className: student.class });
    if (!classFeeDoc)
      return res.status(404).json({ message: 'Class fee not found' });

    const classFee = classFeeDoc.monthlyFee;
    const transportFee = student.transport ? student.transportFee || 0 : 0;

    // find unpaid months
    const lastPayments = await Payment.find({ studentId })
      .sort({ year: -1, month: -1 })
      .limit(12);

    const paidMonths = new Set(lastPayments.flatMap(p => p.monthsCovered));
    const today = dayjs(`${year}-${month}-01`);

    // check previous 6 months dues
    let pendingMonths = [];
    for (let i = 5; i >= 0; i--) {
      const m = today.subtract(i + 1, 'month');
      const label = `${m.format('MMMM')} ${m.year()}`;
      if (!paidMonths.has(label)) {
        pendingMonths.push(label);
      }
    }

    const currentMonthLabel = `${today.format('MMMM')} ${today.year()}`;
    if (!paidMonths.has(currentMonthLabel)) {
      pendingMonths.push(currentMonthLabel);
    }

    const totalDue =
      pendingMonths.length * (classFee + transportFee);

    const demandBill = {
      student,
      classFee,
      transportFee,
      pendingMonths,
      totalPayable: totalDue,
      type: 'demand',
    };

    res.json(demandBill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate demand bill' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { studentId, monthsToPay, startMonth, startYear, amountPaid } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const classFeeDoc = await ClassFee.findOne({ className: student.class });
    if (!classFeeDoc)
      return res.status(404).json({ message: 'Class fee not found' });

    const classFee = classFeeDoc.monthlyFee;
    const transportFee = student.transport ? student.transportFee || 0 : 0;
    const monthList = [];
    let totalAmount = 0;

    for (let i = 0; i < monthsToPay; i++) {
      const m = dayjs(`${startYear}-${startMonth}-01`).add(i, 'month');
      const label = `${m.format('MMMM')} ${m.year()}`;
      monthList.push(label);
      totalAmount += classFee + transportFee;
    }

    const dueAmount = totalAmount - amountPaid;

    const payment = new Payment({
      studentId,
      studentName: student.name,
      className: student.class,
      section: student.section,
      month: startMonth,
      year: startYear,
      classFee,
      transportFee,
      totalAmount,
      amountPaid,
      dueAmount,
      paymentType: 'payment',
      monthsCovered: monthList,
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record payment' });
  }
};
