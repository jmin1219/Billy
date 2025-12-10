---
created: 2025-12-10T10:31
updated: 2025-12-10T10:31
---
# Billy Data Pipeline (ETL)

## 1. Purpose
To act as the "Connector" between Biological Hardware (Apple Watch) and Cognitive Software (Obsidian). It prevents "Context Collapse" by pre-filling daily notes with objective physiological data.

## 2. Architecture
- **Language:** Python 3.13
- **Input:** Apple Health `export.xml` (via Native Export).
- **Logic:** `xml.etree.ElementTree.iterparse()`
    - *Why:* Streaming parser prevents RAM crash on 500MB+ XML files.
- **Filtering:**
    - **Sleep:** Filters for `AsleepREM`, `AsleepCore`, `AsleepDeep`. Ignores generic "InBed".
    - **HRV:** Filters for **Nocturnal Window** (00:00 - 08:00) to exclude "Bed Rot" noise.
- **Output:** Generates `YYYY-MM-DD.md` in `output/daily_notes/`.

## 3. Known Issues (Bugs)
- **The "Time Travel" Bug (Fixed 2025-12-10):**
    - *Symptom:* The script hardcoded `[[Non-Linear Lineage]]` into the template. When regenerating past notes (Dec 01 - Dec 09), it falsely injected today's context into last week's history.
    - *Fix:* Removed hardcoded context from `pipeline.py`. Context must be injected manually or via the Interviewer Agent.

## 4. Code Reference
- **Script Location:** `src/pipeline.py`
- **Dependencies:** `datetime`, `collections`, `statistics`, `os`.