import time
from collections import defaultdict
from typing import Dict, List, Tuple, Optional

# Volatile in-memory transaction history: vendor_key -> [(timestamp, amount), ...]
TRANSACTION_HISTORY: Dict[str, List[Tuple[float, float]]] = defaultdict(list)


def reset_velocity_store() -> None:
    """Resets transaction history to an empty dictionary for deterministic benchmarks."""
    global TRANSACTION_HISTORY
    TRANSACTION_HISTORY.clear()


def record_and_check_velocity(
    vendor_key: str,
    amount: float,
    days_window: int = 7,
    max_weekly_cap: float = 50000.0,
    max_frequency: int = 4,
    current_time: Optional[float] = None,
) -> Tuple[bool, str]:
    """
    Sliding-window velocity tracking in volatile memory.
    Returns: (is_breached, reason)
    - If len(window_entries) >= max_frequency: (True, "VELOCITY_BURST_SUSPICIOUS")
    - If sum(amounts) + amount > max_weekly_cap: (True, "CUMULATIVE_AMOUNT_EXCEEDED")
    - If within thresholds: records entry and returns (False, "")
    """
    global TRANSACTION_HISTORY
    now = current_time if current_time is not None else time.time()
    window_seconds = days_window * 86400.0

    # Evict entries older than days_window
    existing_entries = TRANSACTION_HISTORY[vendor_key]
    valid_entries = [(ts, amt) for ts, amt in existing_entries if (now - ts) <= window_seconds]
    TRANSACTION_HISTORY[vendor_key] = valid_entries

    # Check frequency cap
    if len(valid_entries) >= max_frequency:
        return True, "VELOCITY_BURST_SUSPICIOUS"

    # Check cumulative amount cap
    current_sum = sum(amt for _, amt in valid_entries)
    if current_sum + amount > max_weekly_cap:
        return True, "CUMULATIVE_AMOUNT_EXCEEDED"

    # Within thresholds -> record transaction
    valid_entries.append((now, amount))
    return False, ""
