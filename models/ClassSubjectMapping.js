// backend/models/ClassSubjectMapping.js
import mongoose from 'mongoose';

const mappingSchema = new mongoose.Schema({
  mapping: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

mappingSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({ mapping: {} });
  }
  return doc;
};

export default mongoose.model('ClassSubjectMapping', mappingSchema);