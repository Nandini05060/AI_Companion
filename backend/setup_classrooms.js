const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('./models/Class');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_companion').then(async () => {
  const defaultClasses = [
    { name: 'CE Sec A', code: 'CE-A', description: 'Default classroom for Computer Engineering Section A', branch: 'CE', section: 'A' },
    { name: 'CE Sec B', code: 'CE-B', description: 'Default classroom for Computer Engineering Section B', branch: 'CE', section: 'B' },
    { name: 'AIDS Sec A', code: 'AIDS-A', description: 'Default classroom for Artificial Intelligence & Data Science Section A', branch: 'AIDS', section: 'A' },
    { name: 'AIDS Sec B', code: 'AIDS-B', description: 'Default classroom for Artificial Intelligence & Data Science Section B', branch: 'AIDS', section: 'B' }
  ];

  // Get Admin user
  const adminUser = await User.findOne({ email: 'aicampuscompanion@gmail.com' });
  let adminId = adminUser ? adminUser._id : null;

  for (const clsData of defaultClasses) {
    let cls = await Class.findOne({ code: clsData.code });
    if (!cls) {
      cls = new Class({
        ...clsData,
        members: adminId ? [adminId] : []
      });
      await cls.save();
      console.log(`Created classroom: ${clsData.name}`);
    } else {
      if (adminId && !cls.members.includes(adminId)) {
        cls.members.push(adminId);
        await cls.save();
        console.log(`Added admin to existing classroom: ${clsData.name}`);
      }
    }
    
    if (adminId && adminUser && !adminUser.classes.includes(cls._id)) {
      adminUser.classes.push(cls._id);
    }
  }

  if (adminUser) await adminUser.save();

  console.log("Classroom setup complete.");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
