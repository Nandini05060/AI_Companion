const express = require('express');
const Class = require('../models/Class');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all classes for the logged in user
router.get('/', protect, async (req, res) => {
  try {
    const classes = await Class.find({ members: req.user._id });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join or Create a Class
router.post('/', protect, async (req, res) => {
  const { name, code, description } = req.body;
  
  try {
    let classObj = await Class.findOne({ code });
    if (classObj) {
      // Join existing class
      if (!classObj.members.includes(req.user._id)) {
         classObj.members.push(req.user._id);
         await classObj.save();
      }
      return res.status(200).json(classObj);
    } else {
      // Create new class
      classObj = await Class.create({
        name,
        code,
        description,
        members: [req.user._id]
      });
      res.status(201).json(classObj);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
