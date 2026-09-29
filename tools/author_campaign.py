"""Generate the currently shipped V8.1 campaign. V8 fixtures remain in tests/v8-*."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name("rebalance_campaign.py")),run_name="__main__")
