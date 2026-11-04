// Generates today's lesson with Gemini and saves it to public/data/lessons/<date>.json.
// Usage: node scripts/generate-daily.ts [--force]
import fs from 'node:fs';
import { validateLesson, WORDS_PER_LESSON, type Lesson } from '../src/lib/lesson.ts';
import { lessonPath, readAllLessons, saveLesson } from './data-store.ts';
import { type GeminiModelInfo, parseModelList, pickFallbackModels } from './gemini-models.ts';
import { isTransientStatus, TransientError, withRetry } from './retry.ts';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_ATTEMPTS = 3;
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Main model: wait out short spikes (about 3.5 minutes). Backups: a quicker check each.
const PRIMARY_DELAYS = [30_000, 60_000, 120_000];
const FALLBACK_DELAYS = [20_000, 40_000];
const force = process.argv.includes('--force');

if (!API_KEY) {
  console.error('❌ ไม่พบ GEMINI_API_KEY');
  console.error('👉 PowerShell: $env:GEMINI_API_KEY="ใส่คีย์ของคุณ" แล้วรันใหม่');
  process.exit(1);
}

// Lessons belong to the Thai calendar day, whatever timezone the runner uses.
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

if (fs.existsSync(lessonPath(today)) && !force) {
  console.log(`ℹ️ มีบทเรียนของ ${today} อยู่แล้ว ข้ามการสร้าง (ใช้ --force เพื่อสร้างทับ)`);
  process.exit(0);
}

const past = readAllLessons().filter(l => l.date !== today);
const usedThai = past.flatMap(l => l.words.map(w => w.thai));
const recentThemes = past.slice(-14).map(l => l.theme);
const idPrefix = today.replace(/-/g, '');

const prompt = `
You are an expert Thai curriculum designer writing for foreigners who live in Thailand (expats).
Create the daily Thai lesson for ${today}.

Pick one everyday situation an expat really meets (e.g. ordering at a street stall, taking a Grab,
talking to a condo juristic office, visiting a clinic, at 7-Eleven, renting a motorbike).
Avoid these recent themes: ${recentThemes.join(', ') || 'none'}.

Do NOT reuse any of these previously taught Thai words or phrases: ${usedThai.join(', ') || 'none'}.

Return ONLY JSON in this exact shape:
{
  "date": "${today}",
  "theme": "Short theme name",
  "context": "2-4 word situation label for example sentences, e.g. 'In a Grab' or 'At the clinic'",
  "words": [
    {
      "id": "${idPrefix}-1",
      "thai": "Thai script",
      "phonetic": "Readable romanization with tone diacritics, syllables separated by spaces or hyphens",
      "tones": ["one of mid | low | falling | high | rising for EACH syllable in phonetic, in order"],
      "english": "Short clear English meaning",
      "category": "Short category tag",
      "example": {
        "thai": "Natural Thai sentence a learner would actually say or hear in this situation",
        "phonetic": "Romanization of the example",
        "english": "English translation"
      },
      "note": "One short, practical cultural or usage tip"
    }
  ]
}
Provide exactly ${WORDS_PER_LESSON} words with ids ${idPrefix}-1 to ${idPrefix}-${WORDS_PER_LESSON}.
The number of entries in "tones" must equal the number of syllables in "phonetic".
Accuracy of Thai spelling, tones and romanization matters more than creativity: learners will copy them.
`;

async function requestLesson(model: string, feedback: string): Promise<unknown> {
  const response = await fetch(
    `${API_BASE}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY! },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + feedback }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) {
    const message = `API error ${response.status}: ${result.error?.message ?? JSON.stringify(result)}`;
    throw isTransientStatus(response.status) ? new TransientError(message) : new Error(message);
  }
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`API returned no text: ${JSON.stringify(result).slice(0, 500)}`);
  return JSON.parse(text);
}

/** Backups from GEMINI_FALLBACK_MODELS, or else picked from the models this key can use. */
async function fallbackModels(): Promise<string[]> {
  const configured = parseModelList(process.env.GEMINI_FALLBACK_MODELS).filter(m => m !== MODEL);
  if (configured.length) return configured;
  try {
    const res = await fetch(`${API_BASE}/models?pageSize=1000`, { headers: { 'x-goog-api-key': API_KEY! } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { models = [] } = (await res.json()) as { models?: GeminiModelInfo[] };
    return pickFallbackModels(models, MODEL);
  } catch (err) {
    console.warn(`⚠️ ดึงรายชื่อโมเดลสำรองไม่ได้ (${(err as Error).message}) จะใช้แค่ ${MODEL}`);
    return [];
  }
}

/** Tries each model in turn, moving on when one stays busy after its retries. */
async function requestFromChain(models: string[], start: number, feedback: string) {
  for (let i = start; i < models.length; i++) {
    const model = models[i];
    try {
      const data = await withRetry(() => requestLesson(model, feedback), {
        delaysMs: i === 0 ? PRIMARY_DELAYS : FALLBACK_DELAYS,
        onRetry: (err, n, waitMs) =>
          console.warn(`⏳ ${model} ยังไม่ว่าง (${err.message}) จะลองใหม่ครั้งที่ ${n} ในอีก ${waitMs / 1000} วินาที`)
      });
      return { data, index: i };
    } catch (err) {
      const busy = err instanceof TransientError || err instanceof TypeError || /API error 404/.test((err as Error).message);
      if (!busy || i === models.length - 1) throw err;
      console.warn(`↪️ ${model} ใช้ไม่ได้ตอนนี้ (${(err as Error).message}) เปลี่ยนไปใช้ ${models[i + 1]}`);
    }
  }
  throw new Error('No Gemini model available');
}

async function main() {
  const models = [MODEL, ...(await fallbackModels())];
  console.log(`🤖 กำลังสร้างบทเรียนของ ${today} ด้วย ${MODEL}${models.length > 1 ? ` (สำรอง: ${models.slice(1).join(', ')})` : ''}...`);
  let feedback = '';
  let current = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data, index } = await requestFromChain(models, current, feedback);
    current = index;
    const errors = validateLesson(data, usedThai);
    if (!errors.length) {
      const lesson = data as Lesson;
      saveLesson(lesson);
      console.log(`✅ สร้างบทเรียนสำเร็จด้วย ${models[index]}: "${lesson.theme}"`);
      console.log(`📚 คำศัพท์: ${lesson.words.map(w => w.thai).join(', ')}`);
      return;
    }
    console.warn(`⚠️ รอบที่ ${attempt}: ข้อมูลไม่ผ่านการตรวจ\n  - ${errors.join('\n  - ')}`);
    feedback = `\nYour previous answer had these problems, fix them:\n- ${errors.join('\n- ')}\n`;
  }
  throw new Error(`ข้อมูลจาก AI ไม่ผ่านการตรวจหลังลอง ${MAX_ATTEMPTS} รอบ`);
}

main().catch(err => {
  console.error('❌ เกิดข้อผิดพลาด:', err.message);
  process.exit(1);
});
