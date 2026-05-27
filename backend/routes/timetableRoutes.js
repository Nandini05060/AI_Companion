const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Timetable = require('../models/Timetable');

const router = express.Router();

// @desc    Get user's timetable
// @route   GET /api/timetable
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ userId: req.user._id });
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Save or update user's timetable
// @route   POST /api/timetable
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { days, originalImage } = req.body;
    
    let timetable = await Timetable.findOne({ userId: req.user._id });
    
    if (timetable) {
      // Update existing
      timetable.days = days || timetable.days;
      if (originalImage) timetable.originalImage = originalImage;
      await timetable.save();
    } else {
      // Create new
      timetable = await Timetable.create({
        userId: req.user._id,
        days,
        originalImage
      });
    }
    
    res.status(201).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
