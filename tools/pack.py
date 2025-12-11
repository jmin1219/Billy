import os
import pyperclip  # pip install pyperclip

# Configuration
SOURCE_DIR = "src"
IGNORE_DIRS = {'__pycache__', 'venv', '.git', 'node_modules'}
IGNORE_FILES = {'.DS_Store'}

def pack_context():
    output = []
    output.append("=== BILLY PROJECT SNAPSHOT ===\n")
    
    # 1. The Tree Structure
    output.append("--- DIRECTORY STRUCTURE ---")
    for root, dirs, files in os.walk(SOURCE_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        level = root.replace(SOURCE_DIR, '').count(os.sep)
        indent = ' ' * 4 * (level)
        output.append(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if f not in IGNORE_FILES:
                output.append(f"{subindent}{f}")
    
    output.append("\n--- FILE CONTENTS ---")
    
    # 2. The Code
    for root, dirs, files in os.walk(SOURCE_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.endswith(('.py', '.java', '.md', '.sql')) and file not in IGNORE_FILES:
                path = os.path.join(root, file)
                output.append(f"\n[FILE: {path}]")
                output.append("-" * 40)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        output.append(f.read())
                except Exception as e:
                    output.append(f"Error reading file: {e}")
                output.append("\n" + "=" * 40)

    final_text = "\n".join(output)
    pyperclip.copy(final_text)
    print(f"✅ Context packed! ({len(final_text)} chars copied to clipboard)")

if __name__ == "__main__":
    pack_context()