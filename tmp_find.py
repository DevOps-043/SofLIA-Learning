with open('apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')
for i, line in enumerate(lines):
    if 'const handleSendMessage = async' in line:
        print('handleSendMessage starts at:', i+1)
    if 'const handleVoiceQuestion = async' in line:
        print('handleVoiceQuestion starts at:', i+1)
