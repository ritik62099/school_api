import Attendance from '../models/Attendance.js';

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

    const attendance = await Attendance.findOne({
      date: new Date(date),
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