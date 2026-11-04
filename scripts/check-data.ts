// Validates every lesson file and checks that index.json matches them. Exits 1 on any problem.
import { validateLesson } from '../src/lib/lesson.ts';
import { buildIndex, readAllLessons, readIndex } from './data-store.ts';

const lessons = readAllLessons();
const problems: string[] = [];
const seen: string[] = [];

for (const lesson of lessons) {
  for (const e of validateLesson(lesson, seen)) problems.push(`${lesson.date}: ${e}`);
  seen.push(...lesson.words.map(w => w.thai));
}

if (JSON.stringify(readIndex()) !== JSON.stringify(buildIndex(lessons))) {
  problems.push('index.json is out of date with the lesson files');
}

if (problems.length) {
  console.error(`❌ พบปัญหา ${problems.length} จุด:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✅ ข้อมูลบทเรียนถูกต้อง (${lessons.length} บทเรียน)`);
