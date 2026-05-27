const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_companion').then(async () => {
  await User.updateMany({}, { $set: { isApprovedByAdmin: true } });
  const firstUser = await User.findOne();
  if (firstUser) {
    firstUser.isAdmin = true;
    await firstUser.save();
    console.log("Made user admin:", firstUser.email);
  }
  process.exit(0);
});
