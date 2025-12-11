import os
import pyperclip  # pip install pyperclip

# Configuration
# We assume this script is run from the project root (billy/)
ROOT_DIR = "." 

# Folders to explicitly INCLUDE content for (The "Meat")
INCLUDE_CONTENT_DIRS = {'src', 'concepts', 'tools'}

# Folders to show in Tree but IGNORE content (The "Noise")
IGNORE_CONTENT_DIRS = {'venv', '.git', '.obsidian', 'node_modules', '__pycache__', 'output'}

# File extensions to grab
INCLUDE_EXTENSIONS = {'.py', '.java', '.md', '.sql', '.json', '.ts', '.tsx', '.css'}

def pack_context():
    output = []
    output.append("=== BILLY PROJECT FULL SNAPSHOT ===\n")
    
    # 1. The Tree Structure (Full Map)
    output.append("--- DIRECTORY STRUCTURE ---")
    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter directories to traverse
        dirs[:] = [d for d in dirs if d not in IGNORE_CONTENT_DIRS]
        
        level = root.count(os.sep)
        indent = ' ' * 4 * level
        output.append(f"{indent}{os.path.basename(root)}/")
        
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            # Don't show .DS_Store or hidden files in tree
            if not f.startswith('.'):
                output.append(f"{subindent}{f}")
    
    output.append("\n--- FILE CONTENTS ---")
    
    # 2. The Code & Concepts
    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter directories again for traversal
        dirs[:] = [d for d in dirs if d not in IGNORE_CONTENT_DIRS]
        
        # Check if we are in a folder we want to read
        # (e.g., if root starts with ./src or ./concepts)
        # normalize path to avoid ./ issues
        norm_root = os.path.normpath(root)
        top_level_folder = norm_root.split(os.sep)[0] if os.sep in norm_root else norm_root
        
        # Simple heuristic: if the folder path contains 'src' or 'concepts' or 'tools'
        should_read = any(target in norm_root for target in INCLUDE_CONTENT_DIRS)
        
        if should_read:
            for file in files:
                _, ext = os.path.splitext(file)
                if ext in INCLUDE_EXTENSIONS and not file.startswith('.'):
                    path = os.path.join(root, file)
                    output.append(f"\n[FILE: {path}]")
                    output.append("-" * 40)
                    try:
                        with open(path, 'r', encoding='utf-8') as f:
                            output.append(f.read())
                    except Exception as e:
                        output.append(f"[Error reading file: {e}]")
                    output.append("\n" + "=" * 40)

    final_text = "\n".join(output)
    pyperclip.copy(final_text)
    print(f"✅ Full Context packed! ({len(final_text)} chars copied to clipboard)")
    print(f"   Included folders: {INCLUDE_CONTENT_DIRS}")

if __name__ == "__main__":
    pack_context()