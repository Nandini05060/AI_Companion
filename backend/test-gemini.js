const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  try {
    const base64Image = fs.readFileSync('C:/Users/nandi/.gemini/antigravity/brain/80f0112b-4d61-4079-ad49-476bebca68df/media__1779252097892.png', { encoding: 'base64' });
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `You are an expert OCR AI. Extract the timetable from the image.
CRITICAL INSTRUCTIONS:
1. The user is in 'Batch 1'. 'Batch 1' usually means Group 1, G1, or B1. 'Batch 2' means Group 2, G2, or B2.
2. If a cell contains multiple subjects separated by a slash (/) or comma, ONLY pick the subject that corresponds to the user's batch. Do NOT include subjects meant for other batches.
3. If a class is a Theory or Lecture class for everyone, include it.
4. Extract the exact, full names of the subjects.
5. Return ONLY a raw, perfectly valid JSON string. NO MARKDOWN, NO BACKTICKS, NO EXTRA TEXT.
Format:
{ "days": [ { "day": "Monday", "slots": [ { "subject": "Subject Name", "type": "Theory" } ] } ] }`;

    const imagePart = { inlineData: { data: base64Image, mimeType: 'image/png' } };
    console.log('Sending request to Gemini...');
    const result = await model.generateContent([prompt, imagePart]);
    
    let jsonString = result.response.text();
    console.log('Raw response:', jsonString);
    
    jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    
    console.log('Extracted JSON String:', jsonString);
    const extractedData = JSON.parse(jsonString);
    console.log('Parsed successfully!', Object.keys(extractedData));
  } catch (err) {
    console.error('TEST ERROR:', err);
  }
}
test();
