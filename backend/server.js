const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// Database Connection Logic
const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    // If no URI is provided, spin up a fast local MongoDB!
    if (!uri) {
      console.log('No MONGODB_URI found. Starting local persistent database...');
      
      const dbPath = path.join(__dirname, 'local-db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath);
      }

      const mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 27017, // Static port so Compass connection is consistent
          dbPath: dbPath,
          storageEngine: 'wiredTiger', // Persist data to disk
          dbName: 'ai_companion'
        }
      });
      uri = 'mongodb://127.0.0.1:27017/ai_companion'; // Force specific URI for Compass visibility
    }
    
    await mongoose.connect(uri);
    console.log(`MongoDB Connected successfully to ${uri}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/doubts', require('./routes/doubtRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));

// Basic health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
