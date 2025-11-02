import TransportFee from '../models/TransportFee.js';

// GET all class transport fees
export const getAllTransportFees = async (req, res) => {
  try {
    const fees = await TransportFee.find().sort('className');
    res.json(fees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transport fees' });
  }
};

// POST create / upsert fee
export const setTransportFee = async (req, res) => {
  try {
    const { className, monthlyFee } = req.body;

    if (!className || monthlyFee == null) {
      return res.status(400).json({ message: 'Class name and monthly fee are required' });
    }

    const feeDoc = await TransportFee.findOneAndUpdate(
      { className },
      { monthlyFee },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(feeDoc);
  } catch (err) {
    console.error('TransportFee create error:', err);
    res.status(500).json({ message: 'Failed to set transport fee' });
  }
};

// PUT update
export const updateTransportFee = async (req, res) => {
  try {
    const { className } = req.params;
    const { monthlyFee } = req.body;

    const updated = await TransportFee.findOneAndUpdate(
      { className },
      { monthlyFee },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Class not found' });
    res.json(updated);
  } catch (err) {
    console.error('TransportFee update error:', err);
    res.status(500).json({ message: 'Failed to update transport fee' });
  }
};

// DELETE
export const deleteTransportFee = async (req, res) => {
  try {
    const { className } = req.params;
    const result = await TransportFee.deleteOne({ className });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('TransportFee delete error:', err);
    res.status(500).json({ message: 'Failed to delete transport fee' });
  }
};
