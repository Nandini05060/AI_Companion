const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');

// Setup multer for memory storage (file buffer)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Message is required' });

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.json({ 
      reply: `[MOCK AI] I received: "${message}". Please provide GEMINI_API_KEY to enable real AI.` 
    });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `You are an AI Campus Companion. Help the student with academic questions.\nStudent: ${message}\nResponse:`;
    
    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Extract timetable data from image using Google Gemini
// @route   POST /api/ai/extract-timetable
// @access  Private
router.post('/extract-timetable', protect, upload.single('timetableImage'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(400).json({ message: 'Gemini API Key is required for image extraction.' });
  }

  try {
    // Convert image buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are an expert OCR and data extraction AI. Extract the timetable from the image provided.
You must return the result as a valid JSON object EXACTLY matching this structure, with no markdown formatting or backticks around it:
{
  "days": [
    {
      "day": "Monday",
      "slots": [
        {
          "subject": "Math",
          "startTime": "09:00 AM",
          "endTime": "10:00 AM",
          "faculty": "Dr. Smith",
          "room": "Room 101",
          "type": "Theory"
        }
      ]
    }
  ]
}
If a field is missing in the image, leave it as an empty string. The 'type' should be 'Theory' or 'Lab'. If there are any code blocks in your output, omit the \`\`\`json and \`\`\` tags.`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType || "image/jpeg"
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    let jsonString = result.response.text().trim();
    
    // Clean up potential markdown formatting
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const extractedData = JSON.parse(jsonString);
    res.json(extractedData);

  } catch (error) {
    console.error("AI Extraction Error:", error);
    res.status(500).json({ message: error.message || 'Failed to extract timetable data' });
  }
});

module.exports = router;
