// import Settings from "../models/Settings.js";

// export const saveExamDates = async (req, res) => {
//   try {
//     const { examDates } = req.body;

//     if (!examDates) {
//       return res.status(400).json({ message: "Exam dates required" });
//     }

//     const saved = await Settings.findOneAndUpdate(
//       { key: "examDates" },
//       { value: examDates },
//       { upsert: true, new: true }
//     );

//     res.json({ success: true, examDates: saved.value });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to save exam dates" });
//   }
// };

// export const getExamDates = async (req, res) => {
//   try {
//     const data = await Settings.findOne({ key: "examDates" });

//     res.json({
//       examDates: data ? data.value : ""
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to fetch exam dates" });
//   }
// };



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
