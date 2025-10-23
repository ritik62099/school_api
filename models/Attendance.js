// // models/Attendance.js
// import mongoose from 'mongoose';

// const attendanceSchema = new mongoose.Schema({
//   date: { type: Date, required: true },
//   records: [{
//     studentId: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'Student', 
//       required: true 
//     },
//     present: { 
//       type: Boolean, 
//       default: true, // ✅ Default present, but can be false
//       required: true 
//     }
//   }],
//   markedBy: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   }
// }, { timestamps: true });

// export default mongoose.model('Attendance', attendanceSchema);
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    // ✅ Store only date (not time)
    date: { 
      type: Date, 
      required: true,
      set: (d) => {
        const dt = new Date(d);
        dt.setHours(0, 0, 0, 0);
        return dt;
      }
    },

    // ✅ Class name or section (e.g., "10A", "12B")
    class: { 
      type: String, 
      required: true, 
      trim: true 
    },

    // ✅ Each student's attendance for the day
    records: [
      {
        studentId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Student', 
          required: true 
        },
        present: { 
          type: Boolean, 
          default: true, 
          required: true 
        }
      }
    ],

    // ✅ User who marked attendance
    markedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  },
  { timestamps: true }
);

// ✅ Ensure unique attendance per class per date
attendanceSchema.index({ date: 1, class: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
