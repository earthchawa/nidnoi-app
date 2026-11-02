// scripts/generate-daily.js
import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: ไม่พบ GEMINI_API_KEY!');
  console.error('👉 กรุณารันคำสั่ง: $env:GEMINI_API_KEY="ใส่คีย์ของคุณ" ก่อนรันสคริปต์นี้ครับ');
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];
const archivePath = './data/archive.json';

// ป้องกันปัญหาไฟล์ archive.json ว่างเปล่า
let usedWords = [];
if (fs.existsSync(archivePath)) {
  const content = fs.readFileSync(archivePath, 'utf-8').trim();
  if (content) {
    try {
      usedWords = JSON.parse(content);
    } catch (e) {
      usedWords = [];
    }
  }
}

const prompt = `
You are an expert Thai language curriculum designer for foreigners.
Generate a daily Thai lesson for date: ${today}.
Pick an engaging daily theme (e.g., Street Food, Cafe Hopping, Taking a Tuk-Tuk, Making Friends, Polite Particles, Night Market Shopping).

CRITICAL RULE: Do NOT use any of these previously taught Thai words: ${usedWords.join(', ')}

Return ONLY valid JSON matching this exact structure:
{
  "date": "${today}",
  "theme": "Theme Name",
  "words": [
    {
      "id": "${today.replace(/-/g, '')}-1",
      "thai": "Thai script",
      "phonetic": "Easy karaoke phonetic with tone marks",
      "english": "Clear English meaning",
      "category": "Short category tag",
      "emoji": "Single relevant emoji",
      "exThai": "Natural Thai example sentence",
      "exPhonetic": "Phonetic for example sentence",
      "exEnglish": "English translation of example",
      "note": "Short, fun cultural tip or grammar usage tip"
    }
  ]
}
Provide exactly 5 words.
`;

async function generateDailyLesson() {
  console.log('🤖 กำลังสั่งให้ AI คิดคำศัพท์ภาษาไทยชุดใหม่...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const result = await response.json();

  // เช็กว่า API ตอบ Error กลับมาหรือไม่
  if (!response.ok || result.error) {
    console.error('❌ API Error:', JSON.stringify(result.error || result, null, 2));
    process.exit(1);
  }

  const rawJson = result.candidates[0].content.parts[0].text;
  const lessonData = JSON.parse(rawJson);

  // 1. บันทึกไฟล์คำศัพท์ประจำวัน
  fs.writeFileSync('./data/daily-words.json', JSON.stringify(lessonData, null, 2), 'utf-8');

  // 2. อัปเดตคลังคำศัพท์ที่เคยเรียนแล้ว
  const newThaiWords = lessonData.words.map(w => w.thai);
  fs.writeFileSync(archivePath, JSON.stringify([...usedWords, ...newThaiWords], null, 2), 'utf-8');

  console.log(`✅ สร้างบทเรียนสำเร็จ! หัวข้อวันนี้ (${today}): "${lessonData.theme}"`);
  console.log(`📚 คำศัพท์ที่ได้: ${newThaiWords.join(', ')}`);
}

generateDailyLesson().catch(err => {
  console.error('❌ เกิดข้อผิดพลาดในการรัน:', err.message);
});