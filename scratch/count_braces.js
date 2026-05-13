const fs = require('fs');
const content = fs.readFileSync('apps/web/public/locales/es/admin.json', 'utf8');
let balance = 0;
const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') balance++;
    if (line[j] === '}') balance--;
    if (balance === 0) {
       console.log(`Balance 0 at L${i+1} C${j+1}: "${line}"`);
    }
  }
}
