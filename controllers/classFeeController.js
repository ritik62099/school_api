import ClassFee from '../models/ClassFee.js';
import Class from '../models/Class.js';

// GET all class fees
export const getAllClassFees = async (req, res) => {
  try {
    const fees = await ClassFee.find().sort('className');
    res.json(fees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch fees' });
  }
};

// POST: Set fee for a class
export const setClassFee = async (req, res) => {
  try {
    const { className, monthlyFee } = req.body;

    // Validate class exists
    const classExists = await Class.exists({ name: className });
    if (!classExists) {
      return res.status(400).json({ message: 'Class does not exist' });
    }

    // Upsert fee
    const feeDoc = await ClassFee.findOneAndUpdate(
      { className },
      { monthlyFee },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(feeDoc);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to set fee' });
  }
};

// PUT: Update fee for a class
export const updateClassFee = async (req, res) => {
  try {
    const { className } = req.params;
    const { monthlyFee } = req.body;

    const updated = await ClassFee.findOneAndUpdate(
      { className },
      { monthlyFee },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to update fee' });
  }
};

// DELETE: Remove fee for a class
export const deleteClassFee = async (req, res) => {
  try {
    const { className } = req.params;
    const result = await ClassFee.deleteOne({ className });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json({ message: 'Fee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete fee' });
  }
};