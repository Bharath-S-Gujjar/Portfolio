const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  event: { type: String, required: true },
  college: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  date: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
