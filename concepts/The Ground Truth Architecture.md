---
created: 2025-12-11T14:19
updated: 2025-12-11T14:20
---
# The Ground Truth Architecture

**Tags:** #systems #architecture #python #billy

## The Problem: Hallucination
LLMs (like Gemini/Claude) are probabilistic. They "feel" time rather than measuring it. They will round "4:47 PM" to "5:00 PM."
**Bio-metrics cannot be approximate.**

## The Solution: Hardware Trust
We separate the system into two layers:
1.  **The Clock Module (`src/clock.py`):** The Single Source of Truth. It asks the OS/Kernel for the time. It handles Timezones deterministically.
2.  **The Agent (`src/chat.py`):** The Interface. It receives the time as **Read-Only Data**.

## The Rule
* **Never** ask the LLM "What time is it?"
* **Always** pass the time *to* the LLM.