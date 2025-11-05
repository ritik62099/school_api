// // server/seeds/adminSeed.js
// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';
// import User from './models/User.js';
// import dotenv from 'dotenv';

// dotenv.config();
// const createAdmin = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     // Check if admin already exists
//     const existingAdmin = await User.findOne({ email: 'admin@school.com', role: 'admin' });
//     if (existingAdmin) {
//       console.log('✅ Admin already exists');
//       process.exit(0);
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash('admin123', salt);

//     // Create admin
//     const admin = new User({
//       name: 'School Admin',
//       email: 'admin@school.com',
//       password: hashedPassword,
//       role: 'admin', // ← important
//       isOtpOnly: false
//     });

//     await admin.save();
//     console.log('✅ Admin created: admin@school.com / admin123');
//     process.exit(0);
//   } catch (err) {
//     console.error('❌ Admin creation failed:', err);
//     process.exit(1);
//   }
// };

// createAdmin();

// // seedExams.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import Exam from "./models/Exam.js"; // ✅ correct path to your Exam model

// dotenv.config();

// const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/schoolDB';

// const seedExams = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log('✅ MongoDB connected');

//     // Optional: clear old data
//     await Exam.deleteMany({});
//     console.log('🗑️ Old exam data cleared');

//     // Insert new exams
//     const exams = [
//       { name: 'PA1', maxMarks: 100, isActive: true },
//       { name: 'PA2', maxMarks: 100, isActive: true },
//       { name: 'Half Yearly', maxMarks: 100, isActive: true },
//       { name: 'PA3', maxMarks: 100, isActive: true },
//       { name: 'PA4', maxMarks: 100, isActive: true },
//       { name: 'Final', maxMarks: 100, isActive: true }
//     ];

//     await Exam.insertMany(exams);
//     console.log('✅ Exams inserted successfully');

//     mongoose.connection.close();
//     console.log('🔒 MongoDB connection closed');
//   } catch (err) {
//     console.error('❌ Error seeding exams:', err);
//     mongoose.connection.close();
//   }
// };

// seedExams();


// // scripts/fixStudentClasses.js
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Student from "./models/Student.js"; // adjust this path if needed

// dotenv.config(); // so .env variables (like DB URI) are available

// const run = async () => {
//   try {
//     // ✅ Connect to MongoDB (use your actual connection string)
//     await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/school_db");
//     console.log("✅ Connected to MongoDB");

//     // ✅ Update all students' class names
//     const result = await Student.updateMany({}, [
//       {
//         $set: {
//           class: {
//             $switch: {
//               branches: [
//                 { case: { $eq: ["$class", "1"] }, then: "1st" },
//                 { case: { $eq: ["$class", "2"] }, then: "2nd" },
//                 { case: { $eq: ["$class", "3"] }, then: "3rd" },
//                 { case: { $eq: ["$class", "4"] }, then: "4th" }
//               ],
//               default: "$class"
//             }
//           }
//         }
//       }
//     ]);

//     console.log("✅ Update complete:", result);
//   } catch (err) {
//     console.error("❌ Error:", err);
//   } finally {
//     await mongoose.disconnect();
//     process.exit();
//   }
// };

// run();

// scripts/migrate-teachers.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const migrate = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables!');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ✅ SAFER QUERY: Only teachers where assignedClasses is a non-empty array
  const teachers = await User.find({
    role: 'teacher',
    assignedClasses: {
      $exists: true,
      $type: 'array',    // ← ensure it's an array
      $ne: null,         // ← not null
      $not: { $size: 0 } // ← not empty
    }
  });

  console.log(`Found ${teachers.length} teachers to migrate...`);

  for (const teacher of teachers) {
    // ✅ Extra safety
    const classes = Array.isArray(teacher.assignedClasses)
      ? teacher.assignedClasses
      : [];

    if (classes.length === 0) {
      console.log(`⚠️ Skipping ${teacher.name}: no valid classes`);
      continue;
    }

    const assignments = classes.map(cls => ({
      class: cls,
      subjects: Array.isArray(teacher.assignedSubjects) ? teacher.assignedSubjects : [],
      canMarkAttendance: !!teacher.canMarkAttendance
    }));

    await User.findByIdAndUpdate(teacher._id, {
      teachingAssignments: assignments,
      $unset: {
        assignedClasses: "",
        assignedSubjects: "",
        canMarkAttendance: ""
      }
    });
    console.log(`✅ Migrated: ${teacher.name} (${teacher.email})`);
  }

  console.log('🎉 Migration complete!');
  await mongoose.connection.close();
  process.exit(0);
};

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});