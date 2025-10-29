import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

export const markAttendance = async (req, res) => {
  try {
    const { date, class: className, records } = req.body;
    
    if (!date || !className || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid attendance data' });
    }

    // ✅ Permission check
    if (req.user.role === 'teacher' && !req.user.canMarkAttendance) {
      return res.status(403).json({ message: 'You do not have permission to mark attendance' });
    }

    // ✅ Convert date to start of day (ignoring time differences)
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // ✅ Check if attendance exists for this date and class
    let attendance = await Attendance.findOne({ 
      date: normalizedDate, 
      class: className 
    });

    if (!attendance) {
      // ✅ Create new document for this date
      attendance = new Attendance({
        date: normalizedDate,
        class: className,
        records,
        markedBy: req.user.id
      });
    } else {
      // ✅ Update existing records
      records.forEach(record => {
        const idx = attendance.records.findIndex(
          r => r.studentId.toString() === record.studentId
        );
        if (idx !== -1) {
          attendance.records[idx].present = record.present;
        } else {
          attendance.records.push(record);
        }
      });
    }

    await attendance.save();
    res.status(200).json({ message: 'Attendance saved successfully', attendance });

  } catch (err) {
    console.error('Attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/attendanceController.js
export const getAttendanceByDateAndClass = async (req, res) => {
  try {
    const { date, class: className } = req.query;
    
    if (!date || !className) {
      return res.status(400).json({ message: 'Date and class are required' });
    }

    // ✅ Same normalization as in markAttendance
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0); // ← Yeh line add karo

    const attendance = await Attendance.findOne({
      date: queryDate,
      class: className
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance found' });
    }

    res.json(attendance);
  } catch (err) {
    console.error('Get Attendance Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: Dinon ki list banaye (1 se 31 tak, mahine ke hisaab se)
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate(); // month = 1-12
};

export const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { class: className, year, month } = req.query;

    if (!className || !year || !month) {
      return res.status(400).json({ message: 'Class, year, and month are required' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month); // 1 = January, 10 = October

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid month' });
    }

    // Total students in this class
    const totalStudents = await Student.countDocuments({ class: className });
    if (totalStudents === 0) {
      return res.status(404).json({ message: 'No students found in this class' });
    }

    const daysInMonth = getDaysInMonth(yearNum, monthNum);
    const report = [];

    // Har din ke liye attendance check karein
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      dateObj.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({ date: dateObj, class: className });

      const presentCount = attendance ? attendance.records.filter(r => r.present).length : 0;
      const absentCount = totalStudents - presentCount;

      // Sirf school days (Mon-Fri) include karein? Agar chahiye toh add karein
      report.push({
        date: dateStr,
        totalStudents,
        present: presentCount,
        absent: absentCount,
        marked: !!attendance
      });
    }

    res.json({ report, className, year: yearNum, month: monthNum });
  } catch (err) {
    console.error('Monthly Report Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentMonthlyAttendance = async (req, res) => {
  try {
    const { studentId, year, month } = req.query;

    if (!studentId || !year || !month) {
      return res.status(400).json({ message: 'studentId, year, and month are required' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    // Student info fetch karein
    const student = await Student.findById(studentId).select('name class rollNo');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const report = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      dateObj.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne(
        { date: dateObj, class: student.class },
        { records: 1 }
      );

      const record = attendance?.records.find(r => r.studentId.toString() === studentId);
      const present = record ? record.present : false;

      report.push({
        date: dateStr,
        present
      });
    }

    res.json({
      student: {
        id: student._id,
        name: student.name,
        class: student.class,
        rollNo: student.rollNo
      },
      report
    });
  } catch (err) {
    console.error('Student Monthly Report Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get total attendance for a student in a session (e.g., 2025-26)
export const getStudentTotalAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).select('class');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get all attendance records for this student's class
    const attendanceRecords = await Attendance.find({ class: student.class });

    let totalSchoolDays = 0;
    let totalPresentDays = 0;

    attendanceRecords.forEach(att => {
      totalSchoolDays++; // Each document = 1 school day
      const studentRecord = att.records.find(r => r.studentId.toString() === studentId);
      if (studentRecord && studentRecord.present) {
        totalPresentDays++;
      }
    });

    res.json({
      totalSchoolDays,
      totalPresentDays,
      percentage: totalSchoolDays > 0 ? ((totalPresentDays / totalSchoolDays) * 100).toFixed(2) : 0
    });
  } catch (err) {
    console.error('Total Attendance Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};