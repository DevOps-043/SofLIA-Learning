import os

file_path = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\business-panel\components\BusinessSettings.tsx'
part1 = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\business-panel\components\BusinessSettings_part1.tsx'
part2 = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\business-panel\components\BusinessSettings_part2.tsx'

def split_file():
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
        
        mid = len(data) // 2
        with open(part1, 'wb') as f:
            f.write(data[:mid])
        with open(part2, 'wb') as f:
            f.write(data[mid:])
        print(f"Split completed: {len(data[:mid])} and {len(data[mid:])} bytes")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    split_file()
