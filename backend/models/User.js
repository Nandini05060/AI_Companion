const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  onboarded: { type: Boolean, default: false },
  year: { type: Number },
  branch: { type: String },
  section: { type: String },
  timetableUrl: { type: String },
  schedule: [{ 
    day: { type: String }, 
    slots: [{
      subject: { type: String },
      startTime: { type: String },
      endTime: { type: String },
      type: { type: String },
      room: { type: String },
      faculty: { type: String }
    }] 
  }],
  attendanceData: [{ 
    subject: { type: String, required: true }, 
    attended: { type: Number, default: 0 }, 
    total: { type: Number, default: 0 } 
  }],
  lastAttendanceSync: { type: Date },
  attendanceLog: [{
    date: { type: Date },
    subject: { type: String },
    status: { type: String, enum: ['present', 'absent'] }
  }],
  points: { type: Number, default: 0 },
  currentTheme: { type: String, default: 'default' },
  batch: { type: String, enum: ['Batch 1', 'Batch 2'], default: 'Batch 1' },
  customGreeting: { type: String, default: '' },
  hiddenCards: [{ type: String }],
  profilePicture: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  sapId: { type: String, unique: true, sparse: true },
  isAdmin: { type: Boolean, default: false },
  isApprovedByAdmin: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
