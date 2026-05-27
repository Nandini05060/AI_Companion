const express = require('express');
const User = require('../models/User');
const Class = require('../models/Class');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, sapId } = req.body;
  
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({ 
      name, 
      email, 
      password,
      sapId,
      isVerified: false,
      isApprovedByAdmin: false,
      verificationToken
    });

    if (user) {
      // Send verification email
      const verificationLink = `http://localhost:5173/auth?verify=${verificationToken}`;
      
      const mailOptions = {
        from: `"AI Campus Companion" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Verify Your Email - AI Campus Companion',
        html: `
          <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0f1016; color: #ffffff; border-radius: 16px; border: 1px solid #1f2029;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); width: 60px; height: 60px; border-radius: 16px; margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4);">
                <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="Logo" style="width: 30px; height: 30px; filter: brightness(0) invert(1);" />
              </div>
              <h1 style="color: #ffffff; margin-top: 20px; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">AI Campus Companion</h1>
            </div>
            <div style="background-color: #1a1b23; padding: 30px; border-radius: 12px; border: 1px solid #2a2b36;">
              <h2 style="margin-top: 0; font-size: 20px; color: #f8fafc;">Verify your email</h2>
              <p style="font-size: 16px; color: #94a3b8; line-height: 1.6;">Hi <strong style="color: #ffffff;">${user.name}</strong>,</p>
              <p style="font-size: 16px; color: #94a3b8; line-height: 1.6;">Welcome to the next generation of student productivity. Please verify your email address to activate your account and start your journey.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${verificationLink}" style="background: linear-gradient(to right, #ef4444, #dc2626); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">Verify Email Address</a>
              </div>
              <div style="border-top: 1px solid #2a2b36; padding-top: 20px; margin-top: 20px;">
                <p style="font-size: 13px; color: #64748b; margin-bottom: 5px;">If the button doesn't work, copy and paste this link:</p>
                <p style="font-size: 13px; color: #ef4444; word-break: break-all; margin-top: 0;">${verificationLink}</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <p style="font-size: 12px; color: #475569;">© ${new Date().getFullYear()} AI Campus Companion. All rights reserved.</p>
            </div>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending verification email:", error);
        } else {
          console.log("Verification email sent:", info.response);
        }
      });

      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account before logging in.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    // Use updateOne to bypass any schema validation issues on existing fields
    await User.updateOne(
      { _id: user._id },
      { $set: { isVerified: true }, $unset: { verificationToken: "" } }
    );

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ message: 'Server error during verification: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email before logging in. Check your inbox.' });
      }

      if (!user.isApprovedByAdmin && !user.isAdmin) {
        return res.status(403).json({ message: 'Your account is pending Admin approval. Please wait for verification.' });
      }

      // Auto-enrollment logic
      if (!user.isAdmin && user.branch && user.section) {
        const targetClass = await Class.findOne({ branch: user.branch, section: user.section });
        if (targetClass) {
          if (!targetClass.members.includes(user._id)) {
            targetClass.members.push(user._id);
            await targetClass.save();
          }
          if (!user.classes.includes(targetClass._id)) {
            user.classes.push(targetClass._id);
            await user.save();
          }
        }
      }

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        sapId: user.sapId,
        isAdmin: user.isAdmin,
        isApprovedByAdmin: user.isApprovedByAdmin,
        onboarded: user.onboarded,
        year: user.year,
        attendanceData: user.attendanceData,
        timetableUrl: user.timetableUrl,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
