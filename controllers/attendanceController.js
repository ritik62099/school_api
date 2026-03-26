// controllers/attendanceController.js
import mongoose from "mongoose";
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

/**
 * POST /api/attendance
 * Mark or update attendance (also handles School Closed / Holiday)
 */
export const markAttendance = async (req, res) => {
  try {
    const { date, class: className, records, isSchoolClosed } = req.body;

    // isSchoolClosed true hai to records ka array zaroori nahi
    if (!date || !className || (!Array.isArray(records) && !isSchoolClosed)) {
      return res.status(400).json({ message: 'Invalid attendance data' });
    }

    // ✅ Permission check
    if (req.user.role === 'teacher' && !req.user.canMarkAttendance) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to mark attendance' });
    }

    // ✅ Normalize date: start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // ✅ Check if attendance exists for this date and class
    let attendance = await Attendance.findOne({
      date: normalizedDate,
      class: className,
    });

    if (!attendance) {
      // ✅ Create new document
      attendance = new Attendance({
        date: normalizedDate,
        class: className,
        isSchoolClosed: !!isSchoolClosed,
        records: isSchoolClosed ? [] : records,
        markedBy: req.user.id,
      });
    } else {
      // ✅ Update existing document
      attendance.isSchoolClosed = !!isSchoolClosed;

      if (isSchoolClosed) {
        // School closed → koi records nahi
        attendance.records = [];
      } else {
        // Normal attendance update
        records.forEach((record) => {
          const idx = attendance.records.findIndex(
            (r) => r.studentId.toString() === record.studentId
          );
          if (idx !== -1) {
            attendance.records[idx].present = record.present;
          } else {
            attendance.records.push(record);
          }
        });
      }
    }

    await attendance.save();
    res
      .status(200)
      .json({ message: 'Attendance saved successfully', attendance });
  } catch (err) {
    console.error('Attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/attendance?date=YYYY-MM-DD&class=ClassName
 * Fetch attendance for a date & class
 */
export const getAttendanceByDateAndClass = async (req, res) => {
  try {
    const { date, class: className } = req.query;

    if (!date || !className) {
      return res
        .status(400)
        .json({ message: 'Date and class are required' });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      date: queryDate,
      class: className,
    });

    if (!attendance) {
      // ✅ Return 200 with empty data, not 404
      return res.json({
        date: queryDate,
        class: className,
        records: [],
        markedBy: null,
        isSchoolClosed: false,
      });
    }

    res.json(attendance);
  } catch (err) {
    console.error('Get Attendance Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper: get days in a month
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate(); // month = 1–12
};

/**
 * GET /api/attendance/student-monthly?studentId=...&year=2025&month=2
 * Single student monthly attendance
 */
export const getStudentMonthlyAttendance = async (req, res) => {
  try {
    const { studentId, year, month } = req.query;

    if (!studentId || !year || !month) {
      return res
        .status(400)
        .json({ message: 'studentId, year, and month are required' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const daysInMonth = getDaysInMonth(yearNum, monthNum);

    const student = await Student.findById(studentId).select(
      'name class rollNo'
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const report = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(
        2,
        '0'
      )}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      dateObj.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne(
        { date: dateObj, class: student.class },
        { records: 1, isSchoolClosed: 1 }
      );

      if (attendance?.isSchoolClosed) {
        // Holiday: present null
        report.push({
          date: dateStr,
          present: null,
          isSchoolClosed: true,
        });
        continue;
      }

      const record = attendance?.records.find(
        (r) => r.studentId.toString() === studentId
      );
      const present = record ? record.present : false;

      report.push({
        date: dateStr,
        present,
        isSchoolClosed: false,
      });
    }

    res.json({
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        rollNo: student.rollNo,
      },
      report,
    });
  } catch (err) {
    console.error('Student Monthly Report Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/attendance/student-total/:studentId
 * Total attendance for a student (for whole session)
 */
export const getStudentTotalAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).select('class');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const attendanceRecords = await Attendance.find({
      class: student.class,
    });

    let totalSchoolDays = 0;
    let totalPresentDays = 0;

    attendanceRecords.forEach((att) => {
      // 👇 Closed / Holiday day ko ignore karo
      if (att.isSchoolClosed) {
        return;
      }

      totalSchoolDays++; // only open days

      const studentRecord = att.records.find(
        (r) => r.studentId.toString() === studentId
      );
      if (studentRecord && studentRecord.present) {
        totalPresentDays++;
      }
    });

    res.json({
      totalSchoolDays,
      totalPresentDays,
      percentage:
        totalSchoolDays > 0
          ? ((totalPresentDays / totalSchoolDays) * 100).toFixed(2)
          : 0,
    });
  } catch (err) {
    console.error('Total Attendance Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/attendance/student-total-bulk?ids=1,2,3
 * Bulk total attendance for multiple students
 */
// export const getAttendanceBulk = async (req, res) => {
//   try {
//     const studentIds = req.query.ids?.split(",") || [];

//     if (!studentIds.length) {
//       return res.json({});
//     }

//     const data = await Attendance.aggregate([
//       { $unwind: "$records" },
//       {
//         $match: {
//           "records.studentId": {
//             $in: studentIds.map(id => new mongoose.Types.ObjectId(id))
//           }
//         }
//       },
//       {
//         $group: {
//           _id: "$records.studentId",
//           present: {
//             $sum: { $cond: ["$records.present", 1, 0] }
//           },
//           total: { $sum: 1 }
//         }
//       }
//     ]);

//     const result = {};
//     data.forEach(d => {
//       result[d._id] = {
//         present: d.present,
//         total: d.total,
//         percentage: d.total
//           ? ((d.present / d.total) * 100).toFixed(2)
//           : "0.00"
//       };
//     });

//     res.json(result);
//   } catch (err) {
//     console.error("Attendance bulk error:", err);
//     res.status(500).json({ message: "Attendance bulk error" });
//   }
// };


export const getAttendanceBulk = async (req, res) => {
  try {
    const studentIds = req.query.ids?.split(",").filter(Boolean) || [];
    const session = String(req.query.session || "").trim(); // e.g. 2025-26

    if (!studentIds.length) return res.json({});

    const students = await Student.find({
      _id: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) }
    }).select("_id class");

    const classWiseStudents = {};
    students.forEach((s) => {
      const cls = s.class || "UNKNOWN";
      if (!classWiseStudents[cls]) classWiseStudents[cls] = [];
      classWiseStudents[cls].push(String(s._id));
    });

    const result = {};
    studentIds.forEach((id) => {
      result[id] = { present: 0, total: 0, percentage: "0.00" };
    });

    const toYMD = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const startOfDay = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const parseSessionRange = (sessionText) => {
      // 2025-26 => 01 Apr 2025 to 31 Mar 2026
      const m = sessionText.match(/^(\d{4})-(\d{2}|\d{4})$/);
      if (!m) return null;

      const startYear = Number(m[1]);
      const endYear =
        m[2].length === 2
          ? Number(`${String(startYear).slice(0, 2)}${m[2]}`)
          : Number(m[2]);

      return {
        start: new Date(startYear, 3, 1), // April 1
        end: new Date(endYear, 2, 31),    // March 31
      };
    };

    const sessionRange = parseSessionRange(session);
    if (!sessionRange) {
      return res.status(400).json({ message: "Valid session required, e.g. 2025-26" });
    }

    const today = startOfDay(new Date());
    const effectiveEnd = sessionRange.end > today ? today : sessionRange.end;

    for (const [className, ids] of Object.entries(classWiseStudents)) {
      const attendanceDocs = await Attendance.find({
        class: className,
        date: {
          $gte: sessionRange.start,
          $lte: effectiveEnd,
        },
      }).select("records isSchoolClosed date").sort({ date: 1 });

      // date wise unique doc
      const docMap = new Map();

      for (const doc of attendanceDocs) {
        const key = toYMD(doc.date);

        if (!docMap.has(key)) {
          docMap.set(key, {
            isSchoolClosed: !!doc.isSchoolClosed,
            records: doc.records || [],
          });
        } else {
          const existing = docMap.get(key);

          // open day ko prefer karo
          if (existing.isSchoolClosed && !doc.isSchoolClosed) {
            docMap.set(key, {
              isSchoolClosed: false,
              records: doc.records || [],
            });
          } else if (!existing.isSchoolClosed && !doc.isSchoolClosed) {
            // duplicate open docs me latest overwrite
            docMap.set(key, {
              isSchoolClosed: false,
              records: doc.records || [],
            });
          }
        }
      }

      // April to March tak saare working days banao
      const workingDayKeys = [];
      const cur = new Date(sessionRange.start);
      cur.setHours(0, 0, 0, 0);

      while (cur <= effectiveEnd) {
        const key = toYMD(cur);
        const day = cur.getDay(); // 0 = Sunday
        const doc = docMap.get(key);

        // Sunday skip
        if (day !== 0) {
          // holiday marked hai to skip
          if (!(doc && doc.isSchoolClosed)) {
            workingDayKeys.push(key);
          }
        }

        cur.setDate(cur.getDate() + 1);
      }

      const totalWorkingDays = workingDayKeys.length;

      ids.forEach((studentId) => {
        let presentDays = 0;

        workingDayKeys.forEach((key) => {
          const dayDoc = docMap.get(key);
          if (!dayDoc || dayDoc.isSchoolClosed) return;

          const rec = dayDoc.records.find(
            (r) => String(r.studentId) === String(studentId)
          );

          if (rec?.present === true) presentDays++;
        });

        result[studentId] = {
          present: presentDays,
          total: totalWorkingDays,
          percentage: totalWorkingDays
            ? ((presentDays / totalWorkingDays) * 100).toFixed(2)
            : "0.00",
        };
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Attendance bulk error:", err);
    res.status(500).json({ message: "Attendance bulk error" });
  }
};

/**
 * GET /api/attendance/monthly-report?class=5th&year=2025&month=2
 * Class-wise monthly attendance summary
 */
export const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { class: className, year, month } = req.query;

    if (!className || !year || !month) {
      return res
        .status(400)
        .json({ message: 'Class, year, and month are required' });
    }

    // ✅ Permission check for teachers
    if (req.user.role === 'teacher') {
      const assignedClasses = (req.user.teachingAssignments || []).map(
        (a) => a.class
      );
      if (!assignedClasses.includes(className)) {
        return res.status(403).json({
          message: `You are not authorized to view attendance for class ${className}`,
        });
      }
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid month' });
    }

    const totalStudents = await Student.countDocuments({ class: className });
    if (totalStudents === 0) {
      return res
        .status(404)
        .json({ message: 'No students found in this class' });
    }

    const daysInMonth = getDaysInMonth(yearNum, monthNum);
    const report = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(
        2,
        '0'
      )}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      dateObj.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({
        date: dateObj,
        class: className,
      });

      if (attendance && attendance.isSchoolClosed) {
        // Holiday: sab 0, flag true
        report.push({
          date: dateStr,
          totalStudents,
          present: 0,
          absent: 0,
          marked: true,
          isSchoolClosed: true,
        });
        continue;
      }

      const presentCount = attendance
        ? attendance.records.filter((r) => r.present).length
        : 0;
      const absentCount = totalStudents - presentCount;

      report.push({
        date: dateStr,
        totalStudents,
        present: presentCount,
        absent: absentCount,
        marked: !!attendance,
        isSchoolClosed: false,
      });
    }

    res.json({ report, className, year: yearNum, month: monthNum });
  } catch (err) {
    console.error('Monthly Report Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📊 School-wide daily summary
export const getSchoolDailySummary = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required (YYYY-MM-DD)" });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    // 1️⃣ Sab classes ke student count
    const classCountsAgg = await Student.aggregate([
      { $group: { _id: "$class", totalStudents: { $sum: 1 } } },
    ]);

    if (classCountsAgg.length === 0) {
      return res.json({
        date: queryDate,
        totalStudents: 0,
        totalPresent: 0,
        totalAbsent: 0,
        classes: [],
      });
    }

    const classCountsMap = {};
    let schoolTotalStudents = 0;

    classCountsAgg.forEach((item) => {
      const cls = item._id || "Unassigned";
      classCountsMap[cls] = item.totalStudents;
      schoolTotalStudents += item.totalStudents;
    });

    // 2️⃣ Us date ke saare attendance docs
    const attendanceDocs = await Attendance.find({ date: queryDate });

    const attendanceMap = {};
    attendanceDocs.forEach((doc) => {
      attendanceMap[doc.class] = doc;
    });

    const classesSummary = [];
    let totalPresent = 0;

    for (const [cls, totalStudents] of Object.entries(classCountsMap)) {
      const att = attendanceMap[cls];

      // Class holiday / school closed
      if (att && att.isSchoolClosed) {
        classesSummary.push({
          class: cls,
          totalStudents,
          present: 0,
          absent: 0,
          marked: true,
          isSchoolClosed: true,
        });
        // NOTE: yahan hum closed classes ko present/absent me count nahi kar rahe
        continue;
      }

      let presentCount = 0;
      let marked = false;

      if (att) {
        marked = true;
        presentCount = att.records.filter((r) => r.present).length;
      }

      const absentCount = totalStudents - presentCount;

      classesSummary.push({
        class: cls,
        totalStudents,
        present: presentCount,
        absent: absentCount,
        marked,
        isSchoolClosed: false,
      });

      totalPresent += presentCount;
    }

    // Closed classes ke students "not present" me count ho jayenge, isliye:
    const totalAbsent = schoolTotalStudents - totalPresent;

    res.json({
      date: queryDate,
      totalStudents: schoolTotalStudents,
      totalPresent,
      totalAbsent,
      classes: classesSummary,
    });
  } catch (err) {
    console.error("School Daily Summary Error:", err);
    res.status(500).json({ message: "Server error while fetching school summary" });
  }
};
