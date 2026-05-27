const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const forceVerify = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:64777/'); // Note: use the current persistent db URI
    const users = await User.find({ isVerified: false });
    for (let user of users) {
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
      console.log(`Verified user: ${user.email}`);
    }
    console.log('Done verifying all users.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

forceVerify();
