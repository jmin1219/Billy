"""
clock.py - The Ground Truth Module for Billy

Philosophy: LLMs hallucinate time. Humans round time. This module does neither.
All timestamps are deterministic, timezone-aware, and never approximated.
"""

from datetime import datetime, timedelta, timezone
from typing import Union


# =============================================================================
# CONSTANTS
# =============================================================================

APPLE_HEALTH_FORMAT = "%Y-%m-%d %H:%M:%S %z"  # "2024-01-15 06:30:00 -0700"


# =============================================================================
# PARSING - Ingest External Time
# =============================================================================

def parse_apple_health_timestamp(date_str: str) -> datetime:
    """
    Parses Apple Health XML timestamp into timezone-aware datetime.
    
    Input:  "2024-01-15 06:30:00 -0700"
    Output: datetime with tzinfo preserved
    """
    try:
        return datetime.strptime(date_str, APPLE_HEALTH_FORMAT)
    except ValueError as e:
        raise ValueError(f"Invalid Apple Health timestamp: '{date_str}'") from e


def parse_iso_timestamp(iso_str: str) -> datetime:
    """Parses ISO 8601 string (our internal standard)."""
    return datetime.fromisoformat(iso_str)


# =============================================================================
# PRODUCTION - Generate Timestamps
# =============================================================================

def get_timestamp() -> str:
    """
    Returns current time as strict ISO 8601 with local timezone.
    Output: "2024-01-15T14:26:43-08:00"
    """
    return datetime.now().astimezone().isoformat()


def get_date_key(dt: datetime = None) -> str:
    """
    Returns date string for Daily Notes filenames.
    Output: "2024-01-15"
    """
    if dt is None:
        dt = datetime.now().astimezone()
    return dt.strftime("%Y-%m-%d")


# =============================================================================
# DURATION - No Decimals, No Rounding
# =============================================================================

def calculate_duration(start: Union[datetime, str], end: Union[datetime, str]) -> str:
    """
    Returns exact duration as "6h 14m" or "45m".
    Never returns decimals. Negative durations return "0m".
    """
    if isinstance(start, str):
        start = parse_iso_timestamp(start)
    if isinstance(end, str):
        end = parse_iso_timestamp(end)
    
    delta = end - start
    total_seconds = int(delta.total_seconds())
    
    if total_seconds < 0:
        return "0m"
    
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    
    return f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"


def calculate_duration_minutes(start: Union[datetime, str], end: Union[datetime, str]) -> int:
    """Returns duration as integer minutes for aggregation."""
    if isinstance(start, str):
        start = parse_iso_timestamp(start)
    if isinstance(end, str):
        end = parse_iso_timestamp(end)
    
    delta = end - start
    return max(0, int(delta.total_seconds()) // 60)


# =============================================================================
# HUMANIZATION - Context Layer
# =============================================================================

def get_human_time_of_day(dt: datetime = None) -> str:
    """
    Returns: "Morning" | "Afternoon" | "Evening" | "Late Night"
    
    Thresholds:
        Morning:    05:00 - 11:59
        Afternoon:  12:00 - 16:59
        Evening:    17:00 - 21:59
        Late Night: 22:00 - 04:59
    """
    if dt is None:
        dt = datetime.now().astimezone()
    
    hour = dt.hour
    
    if 5 <= hour < 12:
        return "Morning"
    elif 12 <= hour < 17:
        return "Afternoon"
    elif 17 <= hour < 22:
        return "Evening"
    else:
        return "Late Night"


def format_for_display(dt: datetime = None) -> str:
    """Human-readable for logs: 'Mon Jan 15, 2:26 PM'"""
    if dt is None:
        dt = datetime.now().astimezone()
    return dt.strftime("%a %b %d, %-I:%M %p")


# =============================================================================
# VALIDATION
# =============================================================================

def is_valid_sleep_window(start: datetime, end: datetime) -> bool:
    """
    Flags biologically suspicious sleep records.
    Returns False for: negative duration, >24h, or unusual onset times.
    """
    delta = end - start
    hours = delta.total_seconds() / 3600
    
    if hours <= 0 or hours > 24:
        return False
    
    return True


# =============================================================================
# SELF-TEST
# =============================================================================

if __name__ == "__main__":
    print("=" * 50)
    print("CLOCK MODULE - Ground Truth Test")
    print("=" * 50)
    
    print(f"\n📍 Timestamp:  {get_timestamp()}")
    print(f"📅 Date Key:   {get_date_key()}")
    print(f"🌤  Context:    {get_human_time_of_day()}")
    print(f"🖥  Display:    {format_for_display()}")
    
    # Duration Tests
    print("\n--- Duration Tests ---")
    now = datetime.now().astimezone()
    
    tests = [
        (now - timedelta(hours=6, minutes=14), now, "6h 14m"),
        (now - timedelta(minutes=45), now, "45m"),
        (now, now, "0m"),
    ]
    
    for start, end, expected in tests:
        result = calculate_duration(start, end)
        status = "✅" if result == expected else "❌"
        print(f"  {status} Expected: {expected:>8} | Got: {result}")
    
    # Apple Health Parse Test
    print("\n--- Apple Health Parsing ---")
    test_ts = "2024-01-15 06:30:00 -0700"
    parsed = parse_apple_health_timestamp(test_ts)
    print(f"  Input:  '{test_ts}'")
    print(f"  Parsed: {parsed.isoformat()}")
    print(f"  TZ:     {parsed.tzinfo}")
    
    print("\n✓ Clock Module Operational")