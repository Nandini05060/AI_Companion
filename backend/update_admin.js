const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_companion').then(async () => {
  const email = 'aicampuscompanion@gmail.com';
  const password = 'Admin@123';
  
  let user = await User.findOne({ email });
  if (user) {
    user.isAdmin = true;
    user.isApprovedByAdmin = true;
    user.isVerified = true;
    user.password = password; // pre-save hook will hash it
    await user.save();
    console.log("Updated existing user to admin:", email);
  } else {
    user = new User({
      name: 'System Admin',
      email: email,
      password: password,
      sapId: 'ADMIN_001',
      isAdmin: true,
      isApprovedByAdmin: true,
      isVerified: true,
      onboarded: true
    });
    await user.save();
    console.log("Created new admin user:", email);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
