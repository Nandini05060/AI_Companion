const express = require('express');
const multer = require('multer');
const path = require('path');
const Note = require('../models/Note');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get('/:classId', protect, async (req, res) => {
  try {
    const notes = await Note.find({ classId: req.params.classId }).populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:classId', protect, upload.single('noteFile'), async (req, res) => {
  const { title, subject } = req.body;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const note = await Note.create({
      title,
      subject,
      fileUrl: `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      classId: req.params.classId
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
