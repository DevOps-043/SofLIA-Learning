import sys

file_path = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\business-panel\components\BusinessSettings.tsx'
output_path = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\business-panel\components\BusinessSettings_fix.tsx'

def fix_file():
    try:
        # Try reading as UTF-16
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # Try to decode as UTF-16 LE
        try:
            content = data.decode('utf-16')
            print("Successfully decoded as UTF-16")
        except:
            # Try to decode as UTF-8 ignoring errors
            content = data.decode('utf-8', errors='ignore')
            print("Decoded as UTF-8 (ignoring errors)")
            
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        print("File rewritten as UTF-8")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_file()
