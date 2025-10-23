import Marks from "../models/Mark.js";
import Student from "../models/Student.js";

export const addMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { exams } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ✅ Teacher can only add marks for their assigned classes
    if (req.user.role === 'teacher' && !req.user.assignedClasses.includes(student.class)) {
      return res.status(403).json({ message: "You cannot add marks for this class" });
    }

    let marks = await Marks.findOne({ studentId });
    if (!marks) {
      marks = new Marks({ studentId, class: student.class, exams });
    } else {
      // Merge new exam marks into existing Maps
      for (let exam in exams) {
        if (!marks.exams[exam]) marks.exams[exam] = new Map();
        Object.entries(exams[exam]).forEach(([subject, value]) => {
          marks.exams[exam].set(subject, Number(value) || 0);
        });
      }
    }

    // Calculate total & percentage
    let total = 0, count = 0;
    for (let exam of Object.values(marks.exams)) {
      for (let mark of exam.values()) {
        total += Number(mark) || 0;
        count++;
      }
    }
    marks.total = total;
    marks.percentage = count ? parseFloat((total / count).toFixed(2)) : 0;

    await marks.save();
    res.json({ message: "Marks saved successfully", marks });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




export const getMarksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await Marks.findOne({ studentId })
      .populate("studentId", "name fatherName motherName section rollNo address contactNo attendance class")
      .lean();

    if (!marks || !marks.studentId) {
      return res.status(404).json({ message: "Marks or student not found" });
    }

    // Convert exams Map → plain object (same as getAllMarks)
    const examsPlain = {};
    for (const [examKey, subjectMap] of Object.entries(marks.exams || {})) {
      examsPlain[examKey] = subjectMap instanceof Map 
        ? Object.fromEntries(subjectMap) 
        : (subjectMap || {});
    }

    res.json({
      ...marks,
      exams: examsPlain
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getAllMarks = async (req, res) => {
  try {
    const { class: classFilter, name } = req.query;

    let query = {};
    if (classFilter) query.class = classFilter;

    // ✅ Populate ALL fields needed by frontend report card
    let marksDocs = await Marks.find(query)
      .populate("studentId", "name fatherName motherName section rollNo address contactNo attendance class")
      .lean(); // Use lean() for plain JS objects

    // 🔍 Filter out orphaned records (where student was deleted)
    marksDocs = marksDocs.filter(doc => doc.studentId !== null);

    if (name) {
      const regex = new RegExp(name, "i");
      marksDocs = marksDocs.filter(m => regex.test(m.studentId?.name));
    }

    const marks = marksDocs.map(m => {
      // Convert Map to plain object
      const examsPlain = {};
      for (const [examKey, subjectMap] of Object.entries(m.exams || {})) {
        examsPlain[examKey] = subjectMap instanceof Map 
          ? Object.fromEntries(subjectMap) 
          : (subjectMap || {});
      }

      let total = 0, count = 0;
      Object.values(examsPlain).forEach(examObj => {
        Object.values(examObj).forEach(mark => {
          if (typeof mark === 'number') {
            total += mark;
            count++;
          }
        });
      });

      const percentage = count ? parseFloat((total / count).toFixed(2)) : 0;

      return {
        ...m,
        exams: examsPlain,
        total,
        percentage
      };
    });

    res.json(marks);
  } catch (err) {
    console.error("Get All Marks Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};