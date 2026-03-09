import os

root_dir = 'frontend/src'
markers = ['<<<<<<<', '=======', '>>>>>>>']

for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith('.jsx') or filename.endswith('.css') or filename.endswith('.js'):
            path = os.path.join(dirpath, filename)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                found = []
                for i, line in enumerate(lines):
                    for m in markers:
                        if m in line:
                            found.append(f"{i+1}:{m}")
                
                if found:
                    print(f"File: {path}")
                    for item in found:
                        print(f"  {item}")
            except Exception as e:
                print(f"Error reading {path}: {e}")
