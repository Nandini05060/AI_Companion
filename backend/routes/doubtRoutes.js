const express = require('express');
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:classId', protect, async (req, res) => {
  try {
    const doubts = await Doubt.find({ classId: req.params.classId })
      .populate('author', 'name')
      .populate('replies.author', 'name')
      .sort({ createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:classId', protect, async (req, res) => {
  try {
    const doubt = await Doubt.create({
      question: req.body.question,
      classId: req.params.classId,
      author: req.user._id
    });
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $inc: { points: 2 } }, { new: true });
    const populatedDoubt = await Doubt.findById(doubt._id).populate('author', 'name');
    res.status(201).json({
      doubt: populatedDoubt,
      userPoints: updatedUser.points
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:doubtId/reply', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    doubt.replies.push({ content: req.body.content, author: req.user._id });
    await doubt.save();
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } }, { new: true });
    
    const updatedDoubt = await Doubt.findById(req.params.doubtId).populate('author', 'name').populate('replies.author', 'name');
    res.json({
      doubt: updatedDoubt,
      userPoints: updatedUser.points
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:doubtId/vote', protect, async (req, res) => {
  const { type } = req.body; // 'up' or 'down'
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    // Remove from both first to toggle easily
    doubt.upvotes = doubt.upvotes.filter(id => id.toString() !== req.user._id.toString());
    doubt.downvotes = doubt.downvotes.filter(id => id.toString() !== req.user._id.toString());

    if (type === 'up') doubt.upvotes.push(req.user._id);
    if (type === 'down') doubt.downvotes.push(req.user._id);

    await doubt.save();
    const updated = await Doubt.findById(req.params.doubtId).populate('author', 'name').populate('replies.author', 'name');
    res.json(updated);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/doubts/:doubtId (edit doubt)
router.put('/:doubtId', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    if (doubt.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this doubt' });
    }

    doubt.question = req.body.question;
    await doubt.save();

    const updatedDoubt = await Doubt.findById(doubt._id)
      .populate('author', 'name')
      .populate('replies.author', 'name');
    res.json(updatedDoubt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/doubts/:doubtId (delete doubt)
router.delete('/:doubtId', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    if (doubt.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this doubt' });
    }

    await Doubt.deleteOne({ _id: req.params.doubtId });
    res.json({ message: 'Doubt deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
