

// src/controllers/marksController.js
import Marks from "../models/Mark.js";
import Student from "../models/Student.js";
import ClassSubjectMapping from "../models/ClassSubjectMapping.js";

/**
 * Helper: detect drawing subject (case-insensitive)
 */
const isDrawingSubject = (sub) => String(sub || "").trim().toLowerCase() === "drawing";

/**
 * Get mark value for a subject in an exam object.
 * - For drawing: return string grade ("" if not present)
 * - For numeric subjects: return number (0 if missing / invalid)
 */
const getMarkValue = (examObj, subject) => {
  if (!examObj) return subject && isDrawingSubject(subject) ? "" : 0;
  const raw = examObj[subject];

  if (isDrawingSubject(subject)) {
    if (raw === undefined || raw === null) return "";
    return String(raw);
  }

  const num = parseFloat(raw);
  return isNaN(num) ? 0 : num;
};

/**
 * Calculate weighted total and per-subject details.
 * Drawing is included in details as a grade but excluded from numeric aggregation.
 *
 * Returns: { total: Number, details: { subject: { term1, term2, total, grade? } } }
 */
const calculateWeightedTotal = (exams = {}, subjects = []) => {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return { total: 0, details: {} };
  }

  const details = {};
  let aggregateSum = 0;
  let countedSubjects = 0;

  for (const sub of subjects) {
    if (isDrawingSubject(sub)) {
      // For drawing: preserve the grade/letter in details, but skip numeric calc
      const pa1 = getMarkValue(exams.pa1, sub) || "";
      const pa2 = getMarkValue(exams.pa2, sub) || "";
      const sa1 = getMarkValue(exams.halfYear, sub) || "";
      const pa3 = getMarkValue(exams.pa3, sub) || "";
      const pa4 = getMarkValue(exams.pa4, sub) || "";
      const sa2 = getMarkValue(exams.final, sub) || "";

      // Store the grade (prefer pa1/pa2/sa1/pa3/pa4/sa2 whichever present)
      const grade = pa1 || pa2 || sa1 || pa3 || pa4 || sa2 || "";

      details[sub] = {
        term1: null,
        term2: null,
        total: null,
        grade
      };

      continue; // skip numeric aggregation for drawing
    }

    // Numeric subjects: clamp values as per limits
    const pa1 = Math.min(getMarkValue(exams.pa1, sub), 20);
    const pa2 = Math.min(getMarkValue(exams.pa2, sub), 20);
    const sa1 = Math.min(getMarkValue(exams.halfYear, sub), 80);
    const pa3 = Math.min(getMarkValue(exams.pa3, sub), 20);
    const pa4 = Math.min(getMarkValue(exams.pa4, sub), 20);
    const sa2 = Math.min(getMarkValue(exams.final, sub), 80);

    const term1 = (pa1 / 2) + (pa2 / 2) + sa1; // PA1(10) + PA2(10) + SA1(80) = 100
    const term2Component = pa3 + pa4 + sa2; // PA3(20) + PA4(20) + SA2(80) but we'll average appropriately
    const term2 = (term1 / 2) + (term2Component / 2); // final formula consistent with earlier logic

    details[sub] = {
      term1: parseFloat(term1.toFixed(2)),
      term2: parseFloat(term2.toFixed(2)),
      total: parseFloat(term2.toFixed(2))
    };

    aggregateSum += term2;
    countedSubjects++;
  }

  const overallAverage = countedSubjects ? aggregateSum / countedSubjects : 0;
  return {
    total: parseFloat(overallAverage.toFixed(2)),
    details
  };
};

/**
 * Add or update marks for a student.
 * - sanitizes input
 * - allows drawing grades (A/B/C/D)
 * - merges with existing marks (updates only fields sent in request)
 */
export const addMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { exams = {} } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔐 Teacher authorization: only allow if teacher is assigned to this student's class
    if (req.user && req.user.role === "teacher") {
      const assignedClasses = (req.user.teachingAssignments || []).map(a => a.class);
      if (!assignedClasses.includes(student.class)) {
        return res.status(403).json({ message: "You are not authorized to enter marks for this class" });
      }
    }

    // 🎯 Subjects for this class
    const mappingDoc = await ClassSubjectMapping.getOrCreate();
    const subjects = (mappingDoc.mapping && mappingDoc.mapping[student.class]) || [];

    // 🧴 Sanitize incoming exams (drawing special-case)
    const sanitizedExams = {
      pa1: {}, pa2: {}, pa3: {}, pa4: {},
      halfYear: {}, final: {}
    };

    // Allowed grade letters for drawing
    const GRADE_ALLOWED = new Set(["A","B","C","D","a","b","c","d"]);

    // Small exams (max 20)
    ["pa1", "pa2", "pa3", "pa4"].forEach(examKey => {
      subjects.forEach(sub => {
        if (isDrawingSubject(sub)) {
          const raw = exams[examKey] && exams[examKey][sub];
          const grade = raw && GRADE_ALLOWED.has(String(raw)) ? String(raw).toUpperCase() : "";
          sanitizedExams[examKey][sub] = grade;
        } else {
          const val = getMarkValue(exams[examKey], sub);
          const num = Number(val) || 0;
          sanitizedExams[examKey][sub] = Math.min(Math.max(num, 0), 20);
        }
      });
    });

    // Big exams (max 80)
    ["halfYear", "final"].forEach(examKey => {
      subjects.forEach(sub => {
        if (isDrawingSubject(sub)) {
          const raw = exams[examKey] && exams[examKey][sub];
          const grade = raw && GRADE_ALLOWED.has(String(raw)) ? String(raw).toUpperCase() : "";
          sanitizedExams[examKey][sub] = grade;
        } else {
          const val = getMarkValue(exams[examKey], sub);
          const num = Number(val) || 0;
          sanitizedExams[examKey][sub] = Math.min(Math.max(num, 0), 80);
        }
      });
    });

    let marksDoc = await Marks.findOne({ studentId });

    let finalExams;

    if (!marksDoc) {
      // 🆕 First time: create new doc using sanitizedExams
      finalExams = sanitizedExams;

      const { total: weightedTotal, details: weightedDetails } =
        calculateWeightedTotal(finalExams, subjects);

      marksDoc = new Marks({
        studentId,
        class: student.class,
        exams: finalExams,
        weightedTotal,
        weightedDetails
      });
    } else {
      // 🔁 Update existing doc — MERGE, don't overwrite whole object

      const existing = marksDoc.exams || {};

      // Ensure structure exists
      const mergedExams = {
        pa1: existing.pa1 || {},
        pa2: existing.pa2 || {},
        pa3: existing.pa3 || {},
        pa4: existing.pa4 || {},
        halfYear: existing.halfYear || {},
        final: existing.final || {}
      };

      // Update only fields that were provided in request
      Object.keys(sanitizedExams).forEach(examKey => {
        subjects.forEach(sub => {
          if (exams[examKey] && exams[examKey][sub] !== undefined) {
            mergedExams[examKey][sub] = sanitizedExams[examKey][sub];
          }
        });
      });

      finalExams = mergedExams;

      const { total: weightedTotal, details: weightedDetails } =
        calculateWeightedTotal(finalExams, subjects);

      marksDoc.exams = finalExams;
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

// 👁️ Get marks by student (simplified)
export const getMarksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await Marks.findOne({ studentId })
      .populate("studentId", "name fatherName motherName phone address rollNo attendance class section")
      .lean();

    if (!marks) {
      return res.status(404).json({ message: "Marks record not found" });
    }

    res.json(marks);
  } catch (err) {
    console.error("Get Marks Error:", err);
    res.status(500).json({ message: "Server error while fetching marks" });
  }
};

// 📋 Get all marks (with ranking per class)
export const getAllMarks = async (req, res) => {
  try {
    const marksDocs = await Marks.find()
      .populate("studentId", "name fatherName motherName phone address rollNo attendance class section photo")
      .lean();

    // Group by class
    const classGroups = {};
    marksDocs.forEach((doc) => {
      const cls = doc.class;
      if (!classGroups[cls]) classGroups[cls] = [];
      classGroups[cls].push(doc);
    });

    // Assign ranks within each class based on weightedTotal
    for (const [cls, students] of Object.entries(classGroups)) {
      students.sort((a, b) => (b.weightedTotal || 0) - (a.weightedTotal || 0));

      students.forEach((s, idx) => {
        const prev = students[idx - 1];
        if (idx === 0) {
          s.rank = 1;
        } else if (prev && s.weightedTotal === prev.weightedTotal) {
          s.rank = prev.rank; // tie => same rank
        } else {
          s.rank = idx + 1;
        }
      });
    }

    const rankedList = Object.values(classGroups).flat();

    res.json(rankedList);
  } catch (err) {
    console.error("Get All Marks Error:", err);
    res.status(500).json({ message: "Server error while fetching all marks" });
  }
};
