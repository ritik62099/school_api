

// src/controllers/marksController.js
import Marks from "../models/Mark.js";
import Student from "../models/Student.js";
import ClassSubjectMapping from "../models/ClassSubjectMapping.js";

const getMarkValue = (examObj, subject) => {
  if (!examObj) return 0;
  const value = examObj[subject]; // Plain object access
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const calculateWeightedTotal = (exams = {}, subjects = []) => {
  if (subjects.length === 0) {
    return { total: 0, details: {} }; // Plain object
  }

  const details = {};
  let aggregateSum = 0;

  for (const sub of subjects) {
    const pa1 = Math.min(getMarkValue(exams.pa1, sub), 20);
    const pa2 = Math.min(getMarkValue(exams.pa2, sub), 20);
    const sa1 = Math.min(getMarkValue(exams.halfYear, sub), 80);
    const pa3 = Math.min(getMarkValue(exams.pa3, sub), 20);
    const pa4 = Math.min(getMarkValue(exams.pa4, sub), 20);
    const sa2 = Math.min(getMarkValue(exams.final, sub), 80);

    const term1 = (pa1 / 2) + (pa2 / 2) + sa1;
    const term2Component = pa3 + pa4 + sa2;
    const term2 = (term1 / 2) + (term2Component / 2);

    details[sub] = {
      term1: parseFloat(term1.toFixed(2)),
      term2: parseFloat(term2.toFixed(2)),
      total: parseFloat(term2.toFixed(2))
    };

    aggregateSum += term2;
  }

  const overallAverage = subjects.length ? aggregateSum / subjects.length : 0;
  return {
    total: parseFloat(overallAverage.toFixed(2)),
    details // Plain object
  };
};

export const addMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { exams = {} } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (req.user.role === "teacher") {
  const assignedClasses = (req.user.teachingAssignments || []).map(a => a.class);
  if (!assignedClasses.includes(student.class)) {
    return res.status(403).json({ message: "You are not authorized to enter marks for this class" });
  }
}


    const mappingDoc = await ClassSubjectMapping.getOrCreate();
    const subjects = mappingDoc.mapping[student.class] || [];

    const sanitizedExams = {
      pa1: {}, pa2: {}, pa3: {}, pa4: {},
      halfYear: {}, final: {}
    };

    ["pa1", "pa2", "pa3", "pa4"].forEach(examKey => {
      subjects.forEach(sub => {
        const val = getMarkValue(exams[examKey], sub);
        sanitizedExams[examKey][sub] = Math.min(Math.max(val, 0), 20);
      });
    });

    ["halfYear", "final"].forEach(examKey => {
      subjects.forEach(sub => {
        const val = getMarkValue(exams[examKey], sub);
        sanitizedExams[examKey][sub] = Math.min(Math.max(val, 0), 80);
      });
    });

    const { total: weightedTotal, details: weightedDetails } = 
      calculateWeightedTotal(sanitizedExams, subjects);

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
      // ✅ Direct object assignment (no Maps)
      marksDoc.exams = sanitizedExams;
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

    // ✅ No conversion needed (already plain objects)
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
      .populate("studentId", "name fatherName motherName phone address rollNo attendance class section")
      .lean();

    // ✅ Group students by class
    const classGroups = {};
    marksDocs.forEach((doc) => {
      const cls = doc.class;
      if (!classGroups[cls]) classGroups[cls] = [];
      classGroups[cls].push(doc);
    });

    // ✅ Assign ranks within each class
    for (const [cls, students] of Object.entries(classGroups)) {
      // Sort by total descending
      students.sort((a, b) => (b.weightedTotal || 0) - (a.weightedTotal || 0));

      // Assign rank (1, 2, 3)
      students.forEach((s, idx) => {
        const prev = students[idx - 1];
        // Handle tie condition
        if (idx === 0) {
          s.rank = 1;
        } else if (prev && s.weightedTotal === prev.weightedTotal) {
          s.rank = prev.rank; // same marks = same rank
        } else {
          s.rank = idx + 1;
        }
      });
    }

    // ✅ Merge ranks back into full list
    const rankedList = Object.values(classGroups).flat();

    res.json(rankedList);
  } catch (err) {
    console.error("Get All Marks Error:", err);
    res.status(500).json({ message: "Server error while fetching all marks" });
  }
};
