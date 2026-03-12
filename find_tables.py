import re

file_path = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\lib\supabase\types.ts'

def find_relations():
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all table blocks
    tables = re.findall(r'(\w+): \{[\s\S]*?Row: \{([\s\S]*?)\}', content)
    
    results = []
    for table_name, row_content in tables:
        if 'course_id' in row_content and 'organization_id' in row_content:
            results.append(table_name)
    
    print("Tables with both course_id and organization_id:")
    for res in results:
        print(f"- {res}")

if __name__ == "__main__":
    find_relations()
