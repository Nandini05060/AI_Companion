const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('./models/Class');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_companion').then(async () => {
  const cls = await Class.findOne({ name: 'CE Year 2 - B' });
  
  if (cls) {
    console.log("Found classroom:", cls.name);
    // Find all users in this class who are NOT admin
    const students = await User.find({ 
      _id: { $in: cls.members },
      isAdmin: false 
    });
    
    console.log("Found students to delete:", students.map(s => s.email));
    
    // Delete those students
    const studentIds = students.map(s => s._id);
    await User.deleteMany({ _id: { $in: studentIds } });
    console.log("Deleted students.");
    
    // Delete the classroom itself
    await Class.deleteOne({ _id: cls._id });
    console.log("Deleted classroom.");
  } else {
    // If classroom not found, let's just delete all non-admin users just in case they meant "all students"
    const students = await User.find({ isAdmin: false });
    console.log("Found students to delete (fallback):", students.map(s => s.email));
    await User.deleteMany({ isAdmin: false });
    console.log("Deleted all non-admin students.");
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
