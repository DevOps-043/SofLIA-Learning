const fs = require('fs');
const content = fs.readFileSync('apps/web/public/locales/es/admin.json', 'utf8');
const keys = [];
const lines = content.split('\n');
for (let line of lines) {
  const match = line.match(/^\s*"(.*)":\s*{/);
  if (match) {
    const key = match[1];
    if (keys.includes(key)) {
      console.log(`Duplicate key: ${key}`);
    }
    keys.push(key);
  }
}
