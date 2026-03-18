// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import authRoutes from "./routes/authRoutes.js";
// // import adminRoutes from "./routes/adminRoutes.js";
// import studentRoutes from "./routes/studentRoutes.js";
// import teacherRoutes from "./routes/teacherRoutes.js";
// import attendanceRoutes from './routes/attendanceRoutes.js';
// import marksRoutes from "./routes/markRoutes.js";
// import classSubjectRoutes from './routes/classSubjectRoutes.js';
// import classFeeRoutes from './routes/classFeeRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js';
// import settingsRoutes from "./routes/settingsRoutes.js";

// dotenv.config();
// connectDB();

// const app = express();

// const corsOptions = {
//   origin: [
//     'http://localhost:5173', // or whatever port you use locally
//     'https://school-frontend-drab.vercel.app'
//   ],
//   credentials: true
// };

// app.use(cors(corsOptions));



// // ✅ Allow larger JSON payloads (for non-file requests)
// app.use(express.json({ limit: '10mb' }));

// // ✅ Parse URL-encoded data
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// // ✅ Routes
// app.use("/api/auth", authRoutes);
// // app.use("/api/admin", adminRoutes);
// app.use("/api/students", studentRoutes);

// // server.js
// app.use("/api/teachers", teacherRoutes); // ← plural "teachers"
// app.use('/api/attendance', attendanceRoutes);

// app.use("/api/marks", marksRoutes);
// app.use('/api', classSubjectRoutes);
// app.use('/api/class-fees', classFeeRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use("/api/settings", settingsRoutes);


// app.get("/", (req, res) => {
//     res.send("Hello from Express on Vercel!");
//   });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));




import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dns from "node:dns";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import marksRoutes from "./routes/markRoutes.js";
import classSubjectRoutes from "./routes/classSubjectRoutes.js";
import classFeeRoutes from "./routes/classFeeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

// DNS fix for MongoDB SRV issue
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://school-frontend-drab.vercel.app",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api", classSubjectRoutes);
app.use("/api/class-fees", classFeeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/", (req, res) => {
  res.send("Hello from Express on Vercel!");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("Using DNS servers:", dns.getServers());

    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();