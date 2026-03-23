const fs = require('fs');
const lines = fs.readFileSync('apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx', 'utf8').split('\n');
lines.forEach((l, i) => { 
  if (l.includes('const executeFinalPlanSave = async') || 
      l.includes('const loadUserCourses = ') || 
      l.includes('const handleStudyApproachResponse = async') || 
      l.includes('const handleTargetDateResponse = async')) {
    console.log(i + 1 + ': ' + l.trim());
  }
});
