


import Settings from "../models/Settings.js";

/* --------------------- SAVE EXAM DATES --------------------- */
export const saveExamDates = async (req, res) => {
  try {
    const { examDates } = req.body;

    if (!examDates) {
      return res.status(400).json({ message: "Exam dates required" });
    }

    const saved = await Settings.findOneAndUpdate(
      { key: "examDates" },
      { value: examDates },
      { upsert: true, new: true }
    );

    res.json({ success: true, examDates: saved.value });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to save exam dates" });
  }
};

/* --------------------- GET EXAM DATES --------------------- */
export const getExamDates = async (req, res) => {
  try {
    const data = await Settings.findOne({ key: "examDates" });

    res.json({
      examDates: data ? data.value : ""
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch exam dates" });
  }
};


/* ============================================================
   ⭐ NEW — EXAM VISIBILITY (ON/OFF)
   Key = "examVisibility"
   Value = { visibleExams: [] }
   ============================================================ */

/* --------------------- GET Visible Exams --------------------- */
export const getExamVisibility = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "examVisibility" });

    if (!setting) {
      // default values if not set
      setting = await Settings.create({
        key: "examVisibility",
        value: {
          visibleExams: ["pa1", "pa2", "halfYear", "pa3", "pa4", "final"]
        }
      });
    }

    res.json(setting.value);
  } catch (err) {
    console.log("Visibility Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch visibility" });
  }
};

/* --------------------- SAVE Visible Exams --------------------- */
export const setExamVisibility = async (req, res) => {
  try {
    const { visibleExams } = req.body;

    if (!Array.isArray(visibleExams)) {
      return res.status(400).json({ message: "visibleExams must be an array" });
    }

    const saved = await Settings.findOneAndUpdate(
      { key: "examVisibility" },
      { value: { visibleExams } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Exam visibility updated",
      visibleExams: saved.value.visibleExams
    });

  } catch (err) {
    console.log("Visibility Save Error:", err);
    res.status(500).json({ message: "Failed to save visibility" });
  }
};

/* --------------------- SAVE SESSION (e.g. 2025-26) --------------------- */
export const saveSession = async (req, res) => {
  try {
    const { session } = req.body;

    if (!session || typeof session !== "string") {
      return res.status(400).json({ message: "Session is required (e.g. 2025-26)" });
    }

    const saved = await Settings.findOneAndUpdate(
      { key: "session" },
      { value: { session } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      session: saved.value.session,
    });
  } catch (err) {
    console.log("Save Session Error:", err);
    res.status(500).json({ message: "Failed to save session" });
  }
};

/* --------------------- GET SESSION --------------------- */
export const getSession = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "session" });

    res.json({
      session: setting && setting.value && setting.value.session
        ? setting.value.session
        : "",
    });
  } catch (err) {
    console.log("Get Session Error:", err);
    res.status(500).json({ message: "Failed to fetch session" });
  }
};


/* --------------------- SAVE ADMIT CARD NOTES --------------------- */
export const saveAdmitNotes = async (req, res) => {
  try {
    const { validityNote, customNote } = req.body;

    const saved = await Settings.findOneAndUpdate(
      { key: "admitNotes" },
      { value: { validityNote, customNote } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      notes: saved.value,
    });
  } catch (err) {
    console.log("Save Admit Notes Error:", err);
    res.status(500).json({ message: "Failed to save admit notes" });
  }
};

/* --------------------- GET ADMIT CARD NOTES --------------------- */
export const getAdmitNotes = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "admitNotes" });

    res.json({
      notes: setting && setting.value
        ? setting.value
        : { validityNote: "", customNote: "" },
    });
  } catch (err) {
    console.log("Get Admit Notes Error:", err);
    res.status(500).json({ message: "Failed to fetch admit notes" });
  }
};
