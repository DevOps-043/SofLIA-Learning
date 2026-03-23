const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx');
const content = fs.readFileSync(file, 'utf-8');

const extractFunction = (name) => {
    const startIdx = content.indexOf(`const ${name} = async`);
    if (startIdx === -1) return null;

    let openBraces = 0;
    let endIdx = -1;
    let started = false;

    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') {
            openBraces++;
            started = true;
        } else if (content[i] === '}') {
            openBraces--;
            if (started && openBraces === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }

    if (endIdx !== -1) {
        return content.substring(startIdx, endIdx);
    }
    return null;
}

const msgFn = extractFunction('handleSendMessage');
if (msgFn) fs.writeFileSync('handleSendMessage_extracted.ts', msgFn);

const voiceFn = extractFunction('handleVoiceQuestion');
if (voiceFn) fs.writeFileSync('handleVoiceQuestion_extracted.ts', voiceFn);

console.log('Extraction complete');
