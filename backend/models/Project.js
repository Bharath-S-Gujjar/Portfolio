const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  role: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, default: "" },
  highlights: { type: [String], default: [] },
  gradient: { type: String, default: "from-neon-purple/20 to-neon-blue/5" },
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
