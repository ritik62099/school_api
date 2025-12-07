// import express from "express";
// import { saveExamDates ,getExamDates} from "../controllers/settingsController.js";
// import {auth} from "../middleware/auth.js";
// const router = express.Router();

// router.post("/exam-dates", auth, saveExamDates);
// router.get("/exam-dates", auth, getExamDates);

// export default router;


import express from "express";
import { 
  saveExamDates, 
  getExamDates, 
  getExamVisibility, 
  setExamVisibility ,
  getSession,
  saveSession,
  saveAdmitNotes,
  getAdmitNotes
} from "../controllers/settingsController.js";

import { auth } from "../middleware/auth.js";


const router = express.Router();

/* --- Exam date routes --- */
router.post("/exam-dates", auth,  saveExamDates);
router.get("/exam-dates", auth, getExamDates);

/* --- NEW: Exam visibility ON/OFF --- */
router.get("/exam-visibility", auth, getExamVisibility);
router.post("/exam-visibility", auth,  setExamVisibility);

router.get("/session", auth, getSession);
router.post("/session", auth, saveSession);

router.post("/admit-notes", auth, saveAdmitNotes);
router.get("/admit-notes", auth, getAdmitNotes);

export default router;
