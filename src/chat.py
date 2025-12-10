import google.generativeai as genai
import os
from datetime import datetime
from dotenv import load_dotenv

# --- CONFIG ---
# PASTE YOUR KEY HERE
# Load environment variables from .env file
load_dotenv() 

# Fetch the key securely
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ Error: GEMINI_API_KEY not found. Check your .env file.")
    exit(1)
# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'output', 'daily_notes')

def get_today_note_path():
    date_str = datetime.now().strftime("%Y-%m-%d")
    return os.path.join(OUTPUT_DIR, f"{date_str}.md")

def read_hardware_state(filepath):
    """Reads the 'Hardware State' section from today's note to give Billy context."""
    if not os.path.exists(filepath):
        return "No daily note found. Assume neutral state."
    
    with open(filepath, 'r') as f:
        content = f.read()
        # Simple extraction of the Hardware section
        if "## 1. Hardware State" in content:
            start = content.find("## 1. Hardware State")
            end = content.find("## 2. Context")
            return content[start:end].strip()
    return "Hardware state unknown."

def append_to_note(filepath, summary):
    """Appends the conversation summary to the daily note."""
    if not os.path.exists(filepath):
        print("⚠️ Error: Daily note not found.")
        return

    # Read the file
    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Find where to insert (Under "## 2. Context")
    # We look for the placeholder text usually
    new_lines = []
    inserted = False
    
    for line in lines:
        new_lines.append(line)
        if "## 2. Context (The Software)" in line and not inserted:
            new_lines.append(f"\n{summary}\n")
            inserted = True
    
    # Write back
    with open(filepath, 'w') as f:
        f.writelines(new_lines)
    print(f"✅ Context added to {os.path.basename(filepath)}")

def start_chat():
    genai.configure(api_key=API_KEY)
    
    # 1. Load Context
    note_path = get_today_note_path()
    hardware_state = read_hardware_state(note_path)
    print(f"\n🔌 Connected to: {os.path.basename(note_path)}")
    print(f"📊 Loaded: {hardware_state.replace(chr(10), ' | ')}\n") # Replace newlines for cleaner print

    # 2. Initialize Model
    model = genai.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat(history=[
        {"role": "user", "parts": f"You are Billy, a personal productivity assistant. My current stats: {hardware_state}. Interview me briefly (3-4 questions max) to understand my mental state, current ideas, and friction points. Be concise. Don't be a therapist, be a co-pilot."}
    ])

    print("🤖 Billy: " + chat.send_message("Start the interview.").text)

    # 3. Chat Loop
    while True:
        user_input = input("\nYou: ")
        
        if user_input.lower() in ['exit', 'quit', 'done']:
            print("\n💾 Summarizing session...")
            
            # Ask Billy to format the data
            summary_prompt = "Summarize our conversation into a Dependency Node format. Use bullet points. Format: '- **Input:** [[Concept/Event]] -> **Insight:** ...'. Keep it strictly for Obsidian."
            summary = chat.send_message(summary_prompt).text
            
            append_to_note(note_path, summary)
            break
            
        response = chat.send_message(user_input)
        print(f"🤖 Billy: {response.text}")

if __name__ == "__main__":
    start_chat()