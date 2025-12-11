"""
pipeline.py - Apple Health XML Parser for Billy

Ingests export.xml and generates Daily Notes with Bio-Metrics.
All time logic delegated to clock.py (single source of truth).
"""

import xml.etree.ElementTree as ET
import os
import sys
import json
from collections import defaultdict
from datetime import date
import statistics

# =============================================================================
# IMPORT FIX: Ensure clock.py is importable from project root
# Handles both `python src/pipeline.py` and `python pipeline.py`
# =============================================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from clock import (
    parse_apple_health_timestamp,
    calculate_duration_minutes,
    get_date_key,
    get_timestamp,
    format_for_display,
    get_human_time_of_day,
    is_valid_sleep_window,
)


# =============================================================================
# PATHS
# =============================================================================

XML_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'export.xml')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'output', 'daily_notes')
CONCEPTS_DIR = os.path.join(SCRIPT_DIR, '..', 'concepts')
XP_CACHE_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'xp_cache.json')

os.makedirs(OUTPUT_DIR, exist_ok=True)


# =============================================================================
# KNOWLEDGE XP COUNTER
# =============================================================================

def count_markdown_files(*directories: str) -> int:
    """
    Recursively counts all .md files across given directories.
    """
    total = 0
    for directory in directories:
        if not os.path.exists(directory):
            continue
        for root, _, files in os.walk(directory):
            total += sum(1 for f in files if f.endswith('.md'))
    return total


def load_xp_cache() -> dict:
    """
    Loads the XP cache from disk. Returns default if missing/corrupt.
    """
    try:
        with open(XP_CACHE_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"date": None, "count": 0}


def save_xp_cache(count: int) -> None:
    """
    Persists the current XP count with today's date.
    """
    cache = {
        "date": date.today().isoformat(),
        "count": count
    }
    with open(XP_CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)


def get_knowledge_xp() -> tuple[int, int]:
    """
    Returns (current_count, delta_since_last_cache).
    Updates the cache file.
    """
    current_count = count_markdown_files(CONCEPTS_DIR, OUTPUT_DIR)
    cache = load_xp_cache()
    
    # Calculate delta (default to 0 if no prior cache)
    cached_count = cache.get("count", 0)
    delta = current_count - cached_count
    
    # Persist new state
    save_xp_cache(current_count)
    
    return current_count, delta


# =============================================================================
# DAILY NOTE GENERATION
# =============================================================================

def generate_daily_note(date_key: str, sleep_hours: float, hrv_avg: float, knowledge_xp: tuple[int, int] | None = None):
    """
    Generates the Markdown file with Sleep + HRV data.
    Injects ground-truth timestamp from clock module.
    Optionally includes Knowledge XP counter.
    """
    filename = os.path.join(OUTPUT_DIR, f"{date_key}.md")
    
    # Status Logic
    battery_status = "🟢 Fully Charged" if sleep_hours > 7.0 else "🔴 Low Battery"
    
    # HRV Interpretation (Generic baseline - 40-60ms is average, varies by person)
    hrv_status = "Unknown"
    if hrv_avg > 0:
        hrv_status = "⚡ High Resilience" if hrv_avg > 50 else "⚠️ Stressed/Recovering"

    # Knowledge XP line (if provided)
    xp_line = ""
    if knowledge_xp:
        count, delta = knowledge_xp
        delta_str = f"+{delta}" if delta >= 0 else str(delta)
        xp_line = f"\n- **Knowledge Base:** {count} Nodes ({delta_str} today) 📈"

    # Ground-truth timestamp from clock module
    log_timestamp = get_timestamp()
    display_time = format_for_display()
    time_context = get_human_time_of_day()

    content = f"""# {date_key}

> Generated: {log_timestamp}

## 1. Hardware State (Bio-Metrics)
- **Sleep Duration:** {sleep_hours:.2f} hours ({battery_status})
- **Nocturnal HRV:** {hrv_avg:.1f} ms ({hrv_status}){xp_line}

## 2. Context (The Software)
- **Log Time:** {display_time} ({time_context})
- **Input (Context):** *Use the 'Interviewer Agent' to fill this.*

## 3. Output (The Work)
- [ ] 
"""
    
    if not os.path.exists(filename):
        with open(filename, "w") as f:
            f.write(content)
        print(f"✅ Generated Note: {filename}")
    else:
        print(f"⚠️  Skipped (Note exists): {filename}")


# =============================================================================
# XML PARSING
# =============================================================================

def parse_health_data(xml_file: str):
    """
    Streams through Apple Health XML and extracts:
    - Sleep duration (Core + Deep + REM stages)
    - Nocturnal HRV (00:00 - 08:00 window)
    """
    print(f"Analyzing {xml_file}...")
    print(f"Run timestamp: {get_timestamp()}")
    
    context = ET.iterparse(xml_file, events=("start", "end"))
    
    daily_sleep = defaultdict(int)      # Minutes per day (integer)
    daily_hrv = defaultdict(list)       # HRV readings per day
    skipped_records = 0                 # Data integrity counter

    for event, elem in context:
        if event == "end" and elem.tag == "Record":
            record_type = elem.attrib.get('type')
            
            # --- SLEEP LOGIC ---
            if record_type == "HKCategoryTypeIdentifierSleepAnalysis":
                value = elem.attrib.get('value')
                if value in [
                    "HKCategoryValueSleepAnalysisAsleepCore", 
                    "HKCategoryValueSleepAnalysisAsleepDeep", 
                    "HKCategoryValueSleepAnalysisAsleepREM"
                ]:
                    try:
                        start = parse_apple_health_timestamp(elem.attrib['startDate'])
                        end = parse_apple_health_timestamp(elem.attrib['endDate'])
                        
                        # Validate before aggregating
                        if is_valid_sleep_window(start, end):
                            duration_min = calculate_duration_minutes(start, end)
                            date_key = get_date_key(end)
                            daily_sleep[date_key] += duration_min
                        else:
                            skipped_records += 1
                    except ValueError:
                        skipped_records += 1

            # --- HRV LOGIC ---
            if record_type == "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
                try:
                    val = float(elem.attrib.get('value'))
                    date_obj = parse_apple_health_timestamp(elem.attrib['startDate'])
                    
                    # FILTER: Only count HRV between 00:00 and 08:00 AM (nocturnal)
                    if 0 <= date_obj.hour < 8:
                        date_key = get_date_key(date_obj)
                        daily_hrv[date_key].append(val)
                except (ValueError, TypeError):
                    skipped_records += 1

            elem.clear()  # Incremental parsing with memory cleanup

    # --- REPORT ---
    if skipped_records > 0:
        print(f"⚠️  Skipped {skipped_records} invalid/suspicious records")

    print("\n--- Generating Bio-Dashboard ---")
    
    # Get Knowledge XP once (avoid re-counting per note)
    knowledge_xp = get_knowledge_xp()
    print(f"📚 Knowledge Base: {knowledge_xp[0]} nodes ({'+' if knowledge_xp[1] >= 0 else ''}{knowledge_xp[1]} since last run)")
    
    # Get all unique dates from both sets
    all_dates = sorted(set(list(daily_sleep.keys()) + list(daily_hrv.keys())))[-7:]
    
    for date_key in all_dates:
        # Calculate Sleep Hours from integer minutes
        sleep_minutes = daily_sleep.get(date_key, 0)
        hours = sleep_minutes / 60
        
        # Calculate HRV Average
        hrv_readings = daily_hrv.get(date_key, [])
        avg_hrv = statistics.mean(hrv_readings) if hrv_readings else 0.0
        
        generate_daily_note(date_key, hours, avg_hrv, knowledge_xp)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    parse_health_data(XML_FILE)
