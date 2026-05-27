const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Class = require('../models/Class');
const Doubt = require('../models/Doubt');
const Note = require('../models/Note');
const Task = require('../models/Task');

const router = express.Router();

// @desc    Get all users (students)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve a student
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
router.put('/users/:id/approve', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.isApprovedByAdmin = true;
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a student
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all default classrooms with members
// @route   GET /api/admin/classrooms
// @access  Private/Admin
router.get('/classrooms', protect, admin, async (req, res) => {
  try {
    const classrooms = await Class.find().populate({
      path: 'members',
      select: 'name email sapId points'
    });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get activities for a classroom
// @route   GET /api/admin/classrooms/:id/activities
// @access  Private/Admin
router.get('/classrooms/:id/activities', protect, admin, async (req, res) => {
  try {
    const classroom = await Class.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const memberIds = classroom.members;

    // Fetch doubts
    const doubts = await Doubt.find({ author: { $in: memberIds } })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Fetch notes
    const notes = await Note.find({ author: { $in: memberIds } })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Fetch tasks
    const tasks = await Task.find({ user: { $in: memberIds } })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Map to generic activity format
    let activities = [];
    doubts.forEach(d => activities.push({ type: 'Doubt', title: d.title, userName: d.author?.name, date: d.createdAt, id: d._id }));
    notes.forEach(n => activities.push({ type: 'Note', title: n.title, userName: n.author?.name, date: n.createdAt, id: n._id }));
    tasks.forEach(t => activities.push({ type: 'Task', title: t.title, userName: t.user?.name, date: t.createdAt, id: t._id }));

    // Sort by most recent
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities.slice(0, 20)); // Return top 20 latest activities
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
