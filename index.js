import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import attendanceRoutes from './routes/attendanceRoutes.js';
import marksRoutes from "./routes/markRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: 'https://school-frontend-drab.vercel.app/' }));

// app.use(cors({
//   origin: 'http://localhost:5173', // ← Add your frontend URLs
//   credentials: true // if using cookies (optional)
// }));

// ✅ Allow larger JSON payloads (for non-file requests)
app.use(express.json({ limit: '10mb' }));

// ✅ Parse URL-encoded data
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// ✅ Routes
app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);

// server.js
app.use("/api/teachers", teacherRoutes); // ← plural "teachers"
app.use('/api/attendance', attendanceRoutes);

app.use("/api/marks", marksRoutes);

app.get("/", (req, res) => {
    res.send("Hello from Express on Vercel!");
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



