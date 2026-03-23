import re

filepath = 'apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if re.search(pattern, line):
            print(f'Match found at line {i+1}: {line.strip()[:40]}')

print('--- Searching functions ---')
find_line(r'const executeFinalPlanSave = async')
find_line(r'const loadUserCourses = async')
find_line(r'const handleStudyApproachResponse = async')
find_line(r'const handleTargetDateResponse = async')

