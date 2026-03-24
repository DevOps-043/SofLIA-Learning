import os

file_path = r'c:\Users\Lordg\Desktop\Pulse Hub\SofLIA - Learning\SofLIA-Learning\apps\web\src\features\business-panel\components\BusinessSettings.tsx'

def fix():
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # Remove common BOMs
        if data.startswith(b'\xef\xbb\xbf'):
            data = data[3:]
        elif data.startswith(b'\xff\xfe'):
            data = data.decode('utf-16').encode('utf-8')
        elif data.startswith(b'\xfe\xff'):
            data = data.decode('utf-16-be').encode('utf-8')
        
        # Final pass: decode as utf-8 and ignore any stray bytes
        clean_text = data.decode('utf-8', errors='ignore')
        
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(clean_text)
        print("Done")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix()
