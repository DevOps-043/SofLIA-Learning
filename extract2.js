const fs = require('fs');
const path = require('path');

try {
    const srcFile = path.join(__dirname, 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx');
    const content = fs.readFileSync(srcFile, 'utf-8');

    const extractFunction = (name) => {
        const startIdx = content.indexOf(`  const ${name} = async (`);
        if (startIdx === -1) {
            console.log(`No se encontró ${name}`);
            return null;
        }

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
    const voiceFn = extractFunction('handleVoiceQuestion');

    if (msgFn && voiceFn) {
        fs.writeFileSync('extracted_functions.ts', msgFn + '\n\n' + voiceFn);
        console.log('Successfully extracted functions');
    } else {
        console.log('Failed to extract functions');
    }
} catch (err) {
    console.error('Error:', err);
}
