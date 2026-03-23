import fs from 'fs';

const filePath = 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('handleSendMessage') || lines[i].includes('handleVoiceQuestion')) {
    console.log(`${i + 1}: ${lines[i].trim().substring(0, 100)}`);
  }
}
