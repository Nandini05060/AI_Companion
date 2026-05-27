const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  days: [{
    day: { type: String, required: true },
    slots: [{
      time: { type: String, required: true },
      subject: { type: String, required: true },
      faculty: { type: String },
      room: { type: String },
      type: { type: String, enum: ['lecture', 'lab', 'break', 'other'], default: 'lecture' },
      notes: { type: String }
    }]
  }],
  originalImage: { type: String } // URL to the uploaded image if stored
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
