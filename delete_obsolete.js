const fs = require('fs');

const filePath = 'c:\\\\Users\\\\Lordg\\\\Desktop\\\\Pulse Hub\\\\SofLIA - Learning\\\\SofLIA-Learning\\\\apps\\\\web\\\\src\\\\features\\\\study-planner\\\\components\\\\StudyPlannerLIA.tsx';

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Split considering different line endings (but keeping them is not strictly necessary if we join with \n)
  // To be perfectly safe with Windows \r\n, we use a regex split and rejoin properly, 
  // but just string splitting by \n is usually perfectly fine in Node if we rejoin by \n.
  const lines = content.split(/\r?\n/);
  
  // Keep first 608 lines (indices 0 to 607) and lines from 7321 (index 7320) onwards.
  const newLines = [...lines.slice(0, 608), ...lines.slice(7320)];
  
  fs.writeFileSync(filePath, newLines.join('\r\n'), 'utf-8');
  console.log(`Successfully deleted lines 609 to 7320. New line count: ${newLines.length}`);
} catch (error) {
  console.error("Error:", error.message);
}
