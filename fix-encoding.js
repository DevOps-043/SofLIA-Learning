const fs = require('fs');

const filesToFix = [
  'apps/web/public/locales/es/common.json',
  'apps/web/public/locales/pt/common.json',
  'apps/web/public/locales/en/common.json'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    // Convert back from what seems like accidental latin-1 encoding to proper utf-8
    const fixedContent = content.toString('latin1');
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('Fixed:', filePath);
  }
});
