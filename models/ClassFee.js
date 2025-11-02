import mongoose from 'mongoose';

const classFeeSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  monthlyFee: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('ClassFee', classFeeSchema);