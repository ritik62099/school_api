// routes/marksRoutes.js
import express from "express";
import { addMarks, getMarksByStudent, getAllMarks } from "../controllers/markController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// POST → Add or update marks
router.post("/:studentId", auth,addMarks);

// GET → Single student marks
router.get("/:studentId", getMarksByStudent);

// GET → All marks
router.get("/", getAllMarks);

export default router;
