#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.56.0",
#     "aiohttp>=3.9.0",
# ]
# ///
"""
Universal Playwright Executor for Claude Code

Executes Playwright automation code from:
- File path: uv run run.py script.py
- Inline code: uv run run.py 'await page.goto("...")'
- Stdin: cat script.py | uv run run.py

Ensures proper module resolution by running from skill directory.
"""

import os
import sys
import tempfile
import json
import time
from pathlib import Path
import asyncio
import aiohttp

# Change to script directory for proper module resolution
script_dir = Path(__file__).parent.resolve()
os.chdir(script_dir)


def check_playwright_installed():
    """Check if Playwright is installed."""
    try:
        import playwright

        return True
    except ImportError:
        return False


def get_code_to_execute():
    """Get code to execute from various sources."""
    args = sys.argv[1:]

    # Case 1: File path provided
    if args and Path(args[0]).exists():
        file_path = Path(args[0]).resolve()
        print(f"📄 Executing file: {file_path}")
        return file_path.read_text()

    # Case 2: Inline code provided as argument
    if args:
        print("⚡ Executing inline code")
        return " ".join(args)

    # Case 3: Code from stdin
    if not sys.stdin.isatty():
        print("📥 Reading from stdin")
        return sys.stdin.read()

    # No input
    print("❌ No code to execute", file=sys.stderr)
    print("Usage:", file=sys.stderr)
    print("  uv run run.py script.py          # Execute file", file=sys.stderr)
    print("  uv run run.py 'code here'        # Execute inline", file=sys.stderr)
    print("  cat script.py | uv run run.py    # Execute from stdin", file=sys.stderr)
    sys.exit(1)


def cleanup_old_temp_files():
    """Clean up old temporary execution files from previous runs."""
    try:
        files = [
            f
            for f in script_dir.iterdir()
            if f.name.startswith(".temp-execution-") and f.suffix == ".py"
        ]

        for file in files:
            try:
                file.unlink()
            except (OSError, IOError):
                pass  # Ignore errors - file might be in use or already deleted
    except (OSError, IOError):
        pass  # Ignore directory read errors


def wrap_code_if_needed(code):
    """Wrap code in async function if not already wrapped."""
    # Check if code already has PEP 723 metadata or proper Python structure
    has_pep723 = "# ///" in code and "script" in code.lower()
    has_import = "from playwright" in code or "import playwright" in code
    has_sync_playwright = "sync_playwright()" in code
    has_main = "def main():" in code or "if __name__" in code

    # If it's already a complete script (PEP 723 or has sync_playwright), return as-is
    if has_pep723 or (has_import and (has_sync_playwright or has_main)):
        return code

    # If it's just Playwright commands, wrap in full template
    if not has_import:
        return f'''from playwright.sync_api import sync_playwright
from lib.helpers import *

# Extra headers from environment variables (if configured)
__extra_headers = get_extra_headers_from_env()

def get_context_options_with_headers(options=None):
    """Merge environment headers into context options."""
    if options is None:
        options = {{}}
    if not __extra_headers:
        return options
    return {{
        **options,
        'extra_http_headers': {{
            **__extra_headers,
            **options.get('extra_http_headers', {{}})
        }}
    }}

def main():
    {code}

if __name__ == "__main__":
    main()
'''

    # If has import but no main function
    return f"""def main():
    {code}

if __name__ == "__main__":
    main()
"""


async def detect_dev_servers(custom_ports=None):
    """Detect running dev servers on common ports."""
    if custom_ports is None:
        custom_ports = []

    common_ports = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234]
    all_ports = sorted(set(common_ports + custom_ports))
    detected_servers = []

    print("🔍 Checking for running dev servers...")

    async def check_port(port):
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=0.5)
            ) as session:
                async with session.head(f"http://localhost:{port}") as response:
                    if response.status < 500:
                        return f"http://localhost:{port}"
        except (aiohttp.ClientError, asyncio.TimeoutError):
            pass
        return None

    tasks = [check_port(port) for port in all_ports]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if result and isinstance(result, str):
            detected_servers.append(result)
            print(f"  ✅ Found server on port {result.split(':')[2]}")

    if not detected_servers:
        print("  ❌ No dev servers detected")

    return detected_servers


def main():
    """Main execution function."""
    print("🎭 Playwright Skill - Universal Executor\n")

    # Clean up old temp files from previous runs
    cleanup_old_temp_files()

    # Get code to execute
    raw_code = get_code_to_execute()
    code = wrap_code_if_needed(raw_code)

    # Create temporary file for execution
    temp_file = script_dir / f".temp-execution-{time.time()}.py"

    try:
        # Write code to temp file
        temp_file.write_text(code)

        # Execute the code
        print("🚀 Starting automation...\n")

        # Import and execute the module
        import importlib.util

        spec = importlib.util.spec_from_file_location("temp_module", temp_file)
        module = importlib.util.module_from_spec(spec)
        sys.modules["temp_module"] = module
        spec.loader.exec_module(module)

        # Note: Temp file will be cleaned up on next run
        # This allows long-running async operations to complete safely

    except Exception as error:
        print(f"❌ Execution failed: {error}", file=sys.stderr)
        import traceback

        print("\n📋 Stack trace:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
