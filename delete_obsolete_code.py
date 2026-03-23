import codecs

file_path = r"c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\study-planner\components\StudyPlannerLIA.tsx"
try:
    with codecs.open(file_path, 'r', 'utf-8') as f:
        lines = f.readlines()
    
    # We want to keep lines[:608] and lines[7320:] (0-indexed: lines 1-608 and 7321-end)
    new_lines = lines[:608] + lines[7320:]
    
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.writelines(new_lines)
    print("Successfully deleted lines 609 to 7320.")
except Exception as e:
    print(f"Error: {e}")
