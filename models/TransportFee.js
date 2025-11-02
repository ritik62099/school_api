import mongoose from "mongoose";

const transportFeeSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true },
  monthlyFee: { type: Number, required: true, min: 0 },
});

export default mongoose.model("TransportFee", transportFeeSchema);
