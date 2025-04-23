const mongoose = require('mongoose');

const curfewSchema = new mongoose.Schema({
  date: {
    type: String, // Format: 'YYYY-MM-DD'
    required: true,
    unique: true
  },
  curfewTime: {
    type: String, // e.g., '22:00'
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Curfew', curfewSchema);
