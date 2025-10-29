
// src/controllers/marksController.js
import Marks from "../models/Mark.js";
import Student from "../models/Student.js";

// 📘 Subjects by class
const getSubjectsByClass = (className) => {
  const cls = String(className).trim().toLowerCase();
  if (["nursery", "lkg", "ukg", "play"].includes(cls)) {
    return ["English", "Hindi", "Math", "EVS"];
  }
  return ["Math", "English", "Science", "Hindi", "Social Science"];
};

// 🧮 Helper to safely get mark value
const getMarkValue = (examMap, subject) => {
  if (!examMap) return 0;
  const value = examMap instanceof Map ? examMap.get(subject) : examMap[subject];
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// 🔢 Calculate weighted total as per new logic
const calculateWeightedTotal = (exams = {}, subjects = []) => {
  if (subjects.length === 0) {
    return { total: 0, details: new Map() };
  }

  const details = new Map();
  let aggregateSum = 0;

  for (const sub of subjects) {
    // Each PA out of 20, SA1/SA2 out of 80
    const pa1 = Math.min(getMarkValue(exams.pa1, sub), 20);
    const pa2 = Math.min(getMarkValue(exams.pa2, sub), 20);
    const sa1 = Math.min(getMarkValue(exams.halfYear, sub), 80);

    const pa3 = Math.min(getMarkValue(exams.pa3, sub), 20);
    const pa4 = Math.min(getMarkValue(exams.pa4, sub), 20);
    const sa2 = Math.min(getMarkValue(exams.final, sub), 80);

    // 🧮 Term 1 (Half Year)
    const term1 = (pa1 / 2) + (pa2 / 2) + sa1; // out of 100

    // 🧮 Term 2 (Final)
    const term2Component = pa3 + pa4 + sa2; // out of 120
    const term2 = (term1 / 2) + (term2Component / 2); // 50% of each term

    details.set(sub, {
      term1: parseFloat(term1.toFixed(2)),
      term2: parseFloat(term2.toFixed(2)),
      total: parseFloat(term2.toFixed(2))
    });

    aggregateSum += term2;
  }

  const overallAverage = aggregateSum / subjects.length;
  return {
    total: parseFloat(overallAverage.toFixed(2)),
    details
  };
};

// ✏️ Add or update marks
export const addMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { exams = {} } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔒 Access control for teachers
    if (req.user.role === "teacher" && !req.user.assignedClasses.includes(student.class)) {
      return res.status(403).json({ message: "Access denied for this class" });
    }

    const subjects = getSubjectsByClass(student.class);

    // ✅ Sanitize exam marks
    const sanitizedExams = {
      pa1: {}, pa2: {}, pa3: {}, pa4: {},
      halfYear: {}, final: {}
    };

    // PA1–PA4 max = 20
    ["pa1", "pa2", "pa3", "pa4"].forEach(examKey => {
      subjects.forEach(sub => {
        const val = getMarkValue(exams[examKey], sub);
        sanitizedExams[examKey][sub] = Math.min(Math.max(val, 0), 20);
      });
    });

    // Half-Year & Final max = 80
    ["halfYear", "final"].forEach(examKey => {
      subjects.forEach(sub => {
        const val = getMarkValue(exams[examKey], sub);
        sanitizedExams[examKey][sub] = Math.min(Math.max(val, 0), 80);
      });
    });

    // 🧮 Recalculate weighted total
    const { total: weightedTotal, details: weightedDetails } =
      calculateWeightedTotal(sanitizedExams, subjects);

    // 📥 Upsert marks document
    let marksDoc = await Marks.findOne({ studentId });

    if (!marksDoc) {
      marksDoc = new Marks({
        studentId,
        class: student.class,
        exams: sanitizedExams,
        weightedTotal,
        weightedDetails
      });
    } else {
      ["pa1", "pa2", "halfYear", "pa3", "pa4", "final"].forEach(key => {
        marksDoc.exams[key] = new Map(Object.entries(sanitizedExams[key] || {}));
      });
      marksDoc.weightedTotal = weightedTotal;
      marksDoc.weightedDetails = weightedDetails;
    }

    await marksDoc.save();

    res.status(200).json({
      message: "Marks saved successfully",
      marks: marksDoc
    });
  } catch (err) {
    console.error("Add Marks Error:", err);
    res.status(500).json({ message: "Server error while saving marks" });
  }
};
// 👁️ Get marks by student
export const getMarksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await Marks.findOne({ studentId })
      .populate("studentId", "name fatherName motherName phone address rollNo attendance class section")
      .lean();

    if (!marks) {
      return res.status(404).json({ message: "Marks record not found" });
    }

    const toPlainObj = (map) => (map instanceof Map ? Object.fromEntries(map) : map || {});

    res.json({
      ...marks,
      exams: {
        pa1: toPlainObj(marks.exams.pa1),
        pa2: toPlainObj(marks.exams.pa2),
        halfYear: toPlainObj(marks.exams.halfYear),
        pa3: toPlainObj(marks.exams.pa3),
        pa4: toPlainObj(marks.exams.pa4),
        final: toPlainObj(marks.exams.final)
      },
      weightedDetails: toPlainObj(marks.weightedDetails)
    });
  } catch (err) {
    console.error("Get Marks Error:", err);
    res.status(500).json({ message: "Server error while fetching marks" });
  }
};

// 📋 Get all marks (for teacher dashboard)
export const getAllMarks = async (req, res) => {
  try {
    const marksDocs = await Marks.find()
      .populate("studentId", "name fatherName motherName phone address rollNo attendance class section")
      .lean();

    const toPlainObj = (map) => (map instanceof Map ? Object.fromEntries(map) : map || {});

    const result = marksDocs.map(m => ({
      ...m,
      exams: {
        pa1: toPlainObj(m.exams.pa1),
        pa2: toPlainObj(m.exams.pa2),
        halfYear: toPlainObj(m.exams.halfYear),
        pa3: toPlainObj(m.exams.pa3),
        pa4: toPlainObj(m.exams.pa4),
        final: toPlainObj(m.exams.final)
      },
      weightedDetails: toPlainObj(m.weightedDetails)
    }));

    res.json(result);
  } catch (err) {
    console.error("Get All Marks Error:", err);
    res.status(500).json({ message: "Server error while fetching all marks" });
  }
};