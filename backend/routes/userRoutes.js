const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Class = require('../models/Class');
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Multer setup for local upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// POST /api/user/onboard
router.post('/onboard', protect, upload.single('timetable'), async (req, res) => {
  try {
    const { year, branch, section, batch } = req.body;
    const isBatch1 = batch === 'Batch 2' ? false : true;
    const chosenBatch = batch || 'Batch 1';

    let schedule = [];
    let uniqueSubjects = [];

    // Attempt AI Timetable Parsing
    if (req.file && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const prompt = `You are an expert OCR AI. Extract the timetable from the image.
CRITICAL INSTRUCTIONS:
1. The user is in '${chosenBatch}' (e.g., 'Batch 1' or 'Batch 2'). B1 stands for Batch 1. B2 stands for Batch 2.
2. If a class is a Lab, Practical, or Tutorial (Tut), ONLY include it if it explicitly corresponds to the user's batch (B1 or B2). DO NOT include any lab/tut sessions meant for the other batch. Treat Tutorials (Tut) as "Lab" type.
3. If a class is a Theory or Lecture class, it is for all batches, so ALWAYS include it.
4. Extract the exact, full names of the subjects.
5. Extract the start time and end time (e.g., "09:00 AM", "10:00 AM"). Infer from row/col headers if necessary.
6. Extract faculty name and room number if visible.
7. Return ONLY a raw, perfectly valid JSON string. NO MARKDOWN, NO BACKTICKS, NO EXTRA TEXT.
Format:
{ "days": [ { "day": "Monday", "slots": [ { "subject": "Subject Name", "startTime": "09:00 AM", "endTime": "10:00 AM", "type": "Theory", "room": "101", "faculty": "Dr. Smith" } ] } ] }`;

        const imagePart = { inlineData: { data: base64Image, mimeType: req.file.mimetype || "image/jpeg" } };
        const result = await model.generateContent([prompt, imagePart]);
        
        let jsonString = result.response.text();
        // Robust extraction of JSON ignoring markdown
        jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        const extractedData = JSON.parse(jsonString);
        const extractedSchedule = [];
        const extractedUnique = new Set();
        
        if (extractedData.days) {
          extractedData.days.forEach(d => {
             const daySlots = [];
             if (d.slots) {
               d.slots.forEach(slot => {
                 if (slot.subject) {
                   const subName = slot.subject + (slot.type && !slot.subject.includes(slot.type) ? ` (${slot.type})` : '');
                   daySlots.push({
                     subject: subName,
                     startTime: slot.startTime || slot.start_time || '',
                     endTime: slot.endTime || slot.end_time || '',
                     type: slot.type || '',
                     room: slot.room || '',
                     faculty: slot.faculty || ''
                   });
                   extractedUnique.add(subName);
                 }
               });
             }
             if (daySlots.length > 0) extractedSchedule.push({ day: d.day, slots: daySlots });
          });
        }
        
        if (extractedSchedule.length > 0) {
           schedule = extractedSchedule;
           uniqueSubjects = Array.from(extractedUnique);
        }
      } catch (aiError) {
        console.error("AI parsing error:", aiError);
        return res.status(500).json({ message: "AI Error: " + (aiError.message || "Failed to parse timetable.") });
      }
    }

    // Fallback if AI parsing fails or no image is provided
    if (schedule.length === 0) {
      schedule = [
        { day: "Monday", slots: [
          { subject: `${branch} Core 1 (Theory)`, startTime: "09:00 AM", endTime: "10:00 AM", type: "Theory", room: "101", faculty: "Dr. Alpha" },
          { subject: isBatch1 ? `${branch} Lab 1 (Batch 1)` : `${branch} Lab 1 (Batch 2)`, startTime: "10:00 AM", endTime: "12:00 PM", type: "Lab", room: "Lab A", faculty: "Dr. Beta" }
        ] },
        { day: "Tuesday", slots: [
          { subject: "Maths (Theory)", startTime: "09:00 AM", endTime: "10:00 AM", type: "Theory", room: "102", faculty: "Dr. Gamma" }
        ] }
      ];

      uniqueSubjects = [
        `${branch} Core 1 (Theory)`, 
        isBatch1 ? `${branch} Lab 1 (Batch 1)` : `${branch} Lab 1 (Batch 2)`, 
        "Elective 1 (Theory)", 
        "Maths (Theory)", 
        `${branch} Core 2 (Theory)`, 
        "Project (Lab)", 
        "Seminar (Theory)"
      ];
    }
    
    const attendanceData = uniqueSubjects.map((sub) => ({
      subject: sub,
      attended: 0,
      total: 0
    }));

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        year: Number(year),
        branch,
        section,
        batch: chosenBatch,
        attendanceData,
        timetableUrl: req.file ? `/uploads/${req.file.filename}` : "", // Support optional image upload
        schedule,
        onboarded: true,
        lastAttendanceSync: new Date()
      },
      { new: true }
    );

    let userClass = await Class.findOne({ branch, year: Number(year), section });
    if (!userClass) {
      userClass = await Class.create({
        name: `${branch} Year ${year} - ${section}`,
        code: `${branch}-${year}-${section}`,
        branch,
        year: Number(year),
        section,
        members: [updatedUser._id]
      });
    } else {
      if (!userClass.members.includes(updatedUser._id)) {
        userClass.members.push(updatedUser._id);
        await userClass.save();
      }
    }

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      onboarded: updatedUser.onboarded,
      year: updatedUser.year,
      branch: updatedUser.branch,
      section: updatedUser.section,
      batch: updatedUser.batch,
      attendanceData: updatedUser.attendanceData,
      timetableUrl: updatedUser.timetableUrl,
      profilePicture: updatedUser.profilePicture,
      schedule: updatedUser.schedule,
      points: updatedUser.points,
      currentTheme: updatedUser.currentTheme,
      customGreeting: updatedUser.customGreeting,
      hiddenCards: updatedUser.hiddenCards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during onboarding' });
  }
});

// POST /api/user/sync-attendance
router.post('/sync-attendance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.schedule || user.schedule.length === 0) {
      return res.json({ message: 'No schedule to sync', attendanceData: user?.attendanceData });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastSync = user.lastAttendanceSync;
    if (!lastSync) {
      user.lastAttendanceSync = today;
      await user.save();
      return res.json({ attendanceData: user.attendanceData });
    }

    lastSync.setHours(0, 0, 0, 0);
    const daysPassed = Math.floor((today - lastSync) / (1000 * 60 * 60 * 24));

    if (daysPassed > 0) {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 1; i <= daysPassed; i++) {
        const currentDate = new Date(lastSync);
        currentDate.setDate(currentDate.getDate() + i);
        const dayName = daysOfWeek[currentDate.getDay()];

        const scheduleForDay = user.schedule.find(s => s.day.toLowerCase() === dayName.toLowerCase());
        if (scheduleForDay && scheduleForDay.slots) {
          scheduleForDay.slots.forEach(slot => {
            const subject = slot.subject;
            const attItem = user.attendanceData.find(a => a.subject === subject);
            if (attItem) {
              attItem.total += 1;
              attItem.attended += 1;
              user.attendanceLog.push({
                date: currentDate,
                subject: subject,
                status: 'present'
              });
            }
          });
        }
      }
      user.lastAttendanceSync = today;
      await user.save();
    }
    
    res.json({ attendanceData: user.attendanceData, lastAttendanceSync: user.lastAttendanceSync });
  } catch (error) {
    console.error('Sync Attendance Error:', error);
    res.status(500).json({ message: 'Error syncing attendance' });
  }
});

// GET /api/user/attendance-insights
router.get('/attendance-insights', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const insights = user.attendanceData.map(item => {
      const percentage = item.total === 0 ? 100 : (item.attended / item.total) * 100;
      let safeBunks = 0;
      let neededClasses = 0;
      
      if (percentage >= 80) {
        safeBunks = Math.floor((item.attended / 0.80) - item.total);
      } else {
        neededClasses = Math.ceil(((0.80 * item.total) - item.attended) / 0.20);
      }
      
      return {
        subject: item.subject,
        percentage: Math.round(percentage),
        safeBunks: Math.max(0, safeBunks),
        neededClasses: Math.max(0, neededClasses)
      };
    });
    
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insights' });
  }
});

// PUT /api/user/attendance
router.put('/attendance', protect, async (req, res) => {
  try {
    const { subject, status } = req.body; // status: 'attended' | 'missed'
    const user = await User.findById(req.user._id);
    
    const attItem = user.attendanceData.find(a => a.subject === subject);
    if (!attItem) return res.status(404).json({ message: 'Subject not found' });

    if (status === 'missed') {
      if (attItem.attended > 0) attItem.attended -= 1;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const logItem = user.attendanceLog.find(l => 
        l.subject === subject && 
        new Date(l.date).getTime() === today.getTime()
      );
      if (logItem) {
        logItem.status = 'absent';
      } else {
        user.attendanceLog.push({ date: today, subject, status: 'absent' });
      }
    } else if (status === 'attended') {
      attItem.attended += 1;
      attItem.total += 1;
    }
    
    await user.save();
    res.json(user.attendanceData);
  } catch (error) {
    console.error('Attendance Error:', error);
    res.status(500).json({ message: 'Error updating attendance' });
  }
});

// POST /api/user/pomodoro-reward
router.post('/pomodoro-reward', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Reward 10 points for a completed 25 min pomodoro session
    user.points = (user.points || 0) + 10;
    await user.save();

    res.json({ message: '10 points awarded for focus session!', points: user.points });
  } catch (err) {
    res.status(500).json({ message: 'Error rewarding points' });
  }
});

// GET /api/user/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        onboarded: user.onboarded,
        year: user.year,
        branch: user.branch,
        section: user.section,
        batch: user.batch,
        attendanceData: user.attendanceData,
        timetableUrl: user.timetableUrl,
        profilePicture: user.profilePicture,
        schedule: user.schedule,
        points: user.points,
        currentTheme: user.currentTheme,
        customGreeting: user.customGreeting,
        hiddenCards: user.hiddenCards
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/user/customize
router.put('/customize', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if ((user.points || 0) < 50) {
      return res.status(403).json({ message: 'Dashboard customization requires at least 50 points.' });
    }

    const { theme, greetingNickname, hiddenCards } = req.body;
    
    if (theme !== undefined) user.currentTheme = theme;
    if (greetingNickname !== undefined) user.customGreeting = greetingNickname;
    if (hiddenCards !== undefined) user.hiddenCards = hiddenCards;

    await user.save();
    
    res.json({
      message: 'Dashboard settings customized successfully!',
      currentTheme: user.currentTheme,
      customGreeting: user.customGreeting,
      hiddenCards: user.hiddenCards
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/user/update-profile
router.put('/update-profile', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, year, branch, section, batch } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let classChanged = false;

    if (name) user.name = name;
    if (batch) user.batch = batch;
    
    if (year && user.year !== Number(year)) { user.year = Number(year); classChanged = true; }
    if (branch && user.branch !== branch) { user.branch = branch; classChanged = true; }
    if (section && user.section !== section) { user.section = section; classChanged = true; }
    
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    await user.save();

    if (classChanged) {
      await Class.updateMany(
        { members: user._id },
        { $pull: { members: user._id } }
      );
      
      let newClass = await Class.findOne({ branch: user.branch, year: user.year, section: user.section });
      if (!newClass) {
        newClass = await Class.create({
          name: `${user.branch} Year ${user.year} - ${user.section}`,
          code: `${user.branch}-${user.year}-${user.section}`,
          branch: user.branch,
          year: user.year,
          section: user.section,
          members: [user._id]
        });
      } else {
        if (!newClass.members.includes(user._id)) {
          newClass.members.push(user._id);
          await newClass.save();
        }
      }
    }
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      onboarded: user.onboarded,
      year: user.year,
      branch: user.branch,
      section: user.section,
      batch: user.batch,
      attendanceData: user.attendanceData,
      timetableUrl: user.timetableUrl,
      profilePicture: user.profilePicture,
      schedule: user.schedule,
      points: user.points,
      currentTheme: user.currentTheme,
      customGreeting: user.customGreeting,
      hiddenCards: user.hiddenCards
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/user/update-timetable
router.put('/update-timetable', protect, upload.single('timetable'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No timetable image provided.' });

    let schedule = user.schedule || [];
    let uniqueSubjects = user.attendanceData.map(a => a.subject);

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const prompt = `You are an expert OCR AI. Extract the timetable from the image.
CRITICAL INSTRUCTIONS:
1. The user is in '${user.batch}' (e.g., 'Batch 1' or 'Batch 2'). B1 stands for Batch 1. B2 stands for Batch 2.
2. If a class is a Lab, Practical, or Tutorial (Tut), ONLY include it if it explicitly corresponds to the user's batch (B1 or B2). DO NOT include any lab/tut sessions meant for the other batch. Treat Tutorials (Tut) as "Lab" type.
3. If a class is a Theory or Lecture class, it is for all batches, so ALWAYS include it.
4. Extract the exact, full names of the subjects.
5. Extract the start time and end time (e.g., "09:00 AM", "10:00 AM"). Infer from row/col headers if necessary.
6. Extract faculty name and room number if visible.
7. Return ONLY a raw, perfectly valid JSON string. NO MARKDOWN, NO BACKTICKS, NO EXTRA TEXT.
Format:
{ "days": [ { "day": "Monday", "slots": [ { "subject": "Subject Name", "startTime": "09:00 AM", "endTime": "10:00 AM", "type": "Theory", "room": "101", "faculty": "Dr. Smith" } ] } ] }`;

        const imagePart = { inlineData: { data: base64Image, mimeType: req.file.mimetype || "image/jpeg" } };
        const result = await model.generateContent([prompt, imagePart]);
        
        let jsonString = result.response.text();
        // Robust extraction of JSON ignoring markdown
        jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        const extractedData = JSON.parse(jsonString);
        const extractedSchedule = [];
        const extractedUnique = new Set();
        
        if (extractedData.days) {
          extractedData.days.forEach(d => {
             const daySlots = [];
             if (d.slots) {
               d.slots.forEach(slot => {
                 if (slot.subject) {
                   const subName = slot.subject + (slot.type && !slot.subject.includes(slot.type) ? ` (${slot.type})` : '');
                   daySlots.push({
                     subject: subName,
                     startTime: slot.startTime || slot.start_time || '',
                     endTime: slot.endTime || slot.end_time || '',
                     type: slot.type || '',
                     room: slot.room || '',
                     faculty: slot.faculty || ''
                   });
                   extractedUnique.add(subName);
                 }
               });
             }
             if (daySlots.length > 0) extractedSchedule.push({ day: d.day, slots: daySlots });
          });
        }
        
        if (extractedSchedule.length > 0) {
           schedule = extractedSchedule;
           uniqueSubjects = Array.from(extractedUnique);
        }
      } catch (aiError) {
        console.error("AI parsing error:", aiError);
        return res.status(500).json({ message: "AI Error: " + (aiError.message || "Failed to parse timetable.") });
      }
    }

    user.timetableUrl = `/uploads/${req.file.filename}`;
    user.schedule = schedule;
    
    uniqueSubjects.forEach(sub => {
      if (!user.attendanceData.find(a => a.subject === sub)) {
        user.attendanceData.push({ subject: sub, attended: 0, total: 0 });
      }
    });

    await user.save();
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      onboarded: user.onboarded,
      year: user.year,
      branch: user.branch,
      section: user.section,
      batch: user.batch,
      attendanceData: user.attendanceData,
      timetableUrl: user.timetableUrl,
      profilePicture: user.profilePicture,
      schedule: user.schedule,
      points: user.points,
      currentTheme: user.currentTheme,
      customGreeting: user.customGreeting,
      hiddenCards: user.hiddenCards
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/user/delete-account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    await Class.updateMany(
      { members: req.user._id },
      { $pull: { members: req.user._id } }
    );
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
