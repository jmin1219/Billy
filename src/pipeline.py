import xml.etree.ElementTree as ET
import os
from datetime import datetime
from collections import defaultdict
import statistics

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
XML_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'export.xml')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'output', 'daily_notes')

os.makedirs(OUTPUT_DIR, exist_ok=True)

def parse_date(date_str):
    return datetime.strptime(date_str[:-6], '%Y-%m-%d %H:%M:%S')

def generate_daily_note(date_key, sleep_hours, hrv_avg):
    """
    Generates the Markdown file with Sleep + HRV data.
    """
    filename = os.path.join(OUTPUT_DIR, f"{date_key}.md")
    
    # Status Logic
    battery_status = "🟢 Fully Charged" if sleep_hours > 7.0 else "🔴 Low Battery"
    
    # HRV Interpretation (Generic baseline - usually 40-60ms is average, varies by person)
    hrv_status = "Unknown"
    if hrv_avg > 0:
        hrv_status = "⚡ High Resilience" if hrv_avg > 50 else "⚠️ Stressed/Recovering"

    content = f"""# {date_key}
    
## 1. Hardware State (Bio-Metrics)
- **Sleep Duration:** {sleep_hours:.2f} hours ({battery_status})
- **Nocturnal HRV:** {hrv_avg:.1f} ms ({hrv_status})

## 2. Context (The Software)
*Use the 'Interviewer Agent' to fill this.*
- **Input (Context):** 

## 3. Output (The Work)
- [ ] 
"""
    
    if not os.path.exists(filename):
        with open(filename, "w") as f:
            f.write(content)
        print(f"✅ Generated Note: {filename}")
    else:
        print(f"⚠️  Skipped (Note exists): {filename}")

def parse_health_data(xml_file):
    print(f"Analyzing {xml_file}...")
    context = ET.iterparse(xml_file, events=("start", "end"))
    
    daily_sleep = defaultdict(float)
    daily_hrv = defaultdict(list)  # List to store multiple readings per night

    for event, elem in context:
        if event == "end" and elem.tag == "Record":
            record_type = elem.attrib.get('type')
            
            # --- SLEEP LOGIC ---
            if record_type == "HKCategoryTypeIdentifierSleepAnalysis":
                value = elem.attrib.get('value')
                if value in ["HKCategoryValueSleepAnalysisAsleepCore", 
                             "HKCategoryValueSleepAnalysisAsleepDeep", 
                             "HKCategoryValueSleepAnalysisAsleepREM"]:
                    start = parse_date(elem.attrib['startDate'])
                    end = parse_date(elem.attrib['endDate'])
                    duration = (end - start).total_seconds() / 60
                    daily_sleep[str(end.date())] += duration

            # --- HRV LOGIC (New) ---
            if record_type == "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
                try:
                    val = float(elem.attrib.get('value'))
                    date_obj = parse_date(elem.attrib['startDate'])
                    
                    # FILTER: Only count HRV between 00:00 and 08:00 AM
                    if 0 <= date_obj.hour < 8:
                        daily_hrv[str(date_obj.date())].append(val)
                except:
                    pass

            elem.clear()

    print("\n--- Generating Bio-Dashboard ---")
    # Get all unique dates from both sets
    all_dates = sorted(set(list(daily_sleep.keys()) + list(daily_hrv.keys())))[-7:] # Last 7 days
    
    for date in all_dates:
        # Calculate Sleep Hours
        hours = daily_sleep.get(date, 0) / 60
        
        # Calculate HRV Average
        hrv_readings = daily_hrv.get(date, [])
        avg_hrv = statistics.mean(hrv_readings) if hrv_readings else 0.0
        
        generate_daily_note(date, hours, avg_hrv)

if __name__ == "__main__":
    parse_health_data(XML_FILE)