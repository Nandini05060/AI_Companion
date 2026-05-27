const express = require('express');
const multer = require('multer');
const path = require('path');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `resource-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// POST /api/resources/:classId
router.post('/:classId', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, subject, fileType, tags } = req.body;
    let fileUrl = '';
    
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const resource = await Resource.create({
      title,
      subject,
      fileType: fileType || 'Note',
      tags: tags ? tags.split(',') : [],
      fileUrl,
      uploadedBy: req.user._id,
      classId: req.params.classId
    });

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } }, { new: true });

    const populatedResource = await resource.populate('uploadedBy', 'name');
    res.status(201).json({
      resource: populatedResource,
      userPoints: updatedUser.points
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/resources/:classId
router.get('/:classId', protect, async (req, res) => {
  try {
    const resources = await Resource.find({ classId: req.params.classId })
      .populate('uploadedBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/resources/:id/vote
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Remove existing votes by this user
    resource.upvotes = resource.upvotes.filter(id => id.toString() !== req.user._id.toString());
    resource.downvotes = resource.downvotes.filter(id => id.toString() !== req.user._id.toString());

    if (type === 'up') {
      resource.upvotes.push(req.user._id);
    } else if (type === 'down') {
      resource.downvotes.push(req.user._id);
    }

    await resource.save();
    const updatedResource = await resource.populate('uploadedBy', 'name');
    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/resources/:id/summarize
router.post('/:id/summarize', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (resource.aiSummary) {
      return res.json({ summary: resource.aiSummary });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI API key missing' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Since we don't have text extraction for PDFs setup here, we'll prompt Gemini to generate a summary based on the metadata.
    // In a real scenario, you'd parse the PDF/text file and send it.
    const prompt = `You are an academic AI assistant. A student uploaded a resource titled "${resource.title}" for the subject "${resource.subject}". It is tagged as a ${resource.fileType}. Generate a concise, 3-sentence summary predicting what this material covers to help other students decide if they should read it.`;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    resource.aiSummary = summary;
    await resource.save();
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
