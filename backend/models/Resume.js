const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: '' },
    provider: { type: String, enum: ['local', 'cloudinary'], default: 'local' },
    originalName: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
