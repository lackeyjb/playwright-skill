#!/usr/bin/env python3
"""
Universal Patchright Executor for Claude Code

Executes Patchright automation code from:
- File path: python run.py script.py
- Inline code: python run.py 'await page.goto("...")'
- Stdin: cat script.py | python run.py

Ensures proper module resolution by running from skill directory.
Uses Patchright (undetected Playwright fork) for anti-bot evasion.
"""

import os
import sys
import subprocess
import tempfile
import glob
from pathlib import Path

# Change to skill directory for proper module resolution
SKILL_DIR = Path(__file__).parent.resolve()
os.chdir(SKILL_DIR)

# Add skill directory to Python path
sys.path.insert(0, str(SKILL_DIR))


def check_patchright_installed():
    """Check if Patchright is installed"""
    try:
        import patchright
        return True
    except ImportError:
        return False


def is_uv_available():
    """Check if uv is available"""
    try:
        subprocess.run(
            ["uv", "--version"],
            check=True,
            capture_output=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def install_patchright():
    """Install Patchright if missing. Prefers uv, falls back to pip."""
    print("📦 Patchright not found. Installing...")

    use_uv = is_uv_available()

    try:
        if use_uv:
            print("  Using uv for installation...")
            subprocess.run(
                ["uv", "pip", "install", "patchright"],
                check=True,
                cwd=SKILL_DIR
            )
        else:
            print("  Using pip for installation (uv not found)...")
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "patchright"],
                check=True,
                cwd=SKILL_DIR
            )

        subprocess.run(
            [sys.executable, "-m", "patchright", "install", "chromium"],
            check=True,
            cwd=SKILL_DIR
        )
        print("✅ Patchright installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Patchright: {e}")
        installer = "uv pip" if use_uv else "pip"
        print(f"Please run manually: {installer} install patchright && uv run patchright install chromium")
        return False


def get_code_to_execute():
    """Get code to execute from various sources"""
    args = sys.argv[1:]

    # Case 1: File path provided
    if args and os.path.isfile(args[0]):
        file_path = os.path.abspath(args[0])
        print(f"📄 Executing file: {file_path}")
        with open(file_path, 'r') as f:
            return f.read()

    # Case 2: Inline code provided as argument
    if args:
        print("⚡ Executing inline code")
        return ' '.join(args)

    # Case 3: Code from stdin
    if not sys.stdin.isatty():
        print("📥 Reading from stdin")
        return sys.stdin.read()

    # No input
    print("❌ No code to execute")
    print("Usage:")
    print("  python run.py script.py          # Execute file")
    print('  python run.py "code here"        # Execute inline')
    print("  cat script.py | python run.py    # Execute from stdin")
    sys.exit(1)


def cleanup_old_temp_files():
    """Clean up old temporary execution files from previous runs"""
    try:
        temp_files = glob.glob(str(SKILL_DIR / ".temp-execution-*.py"))
        for file_path in temp_files:
            try:
                os.unlink(file_path)
            except Exception:
                pass  # Ignore errors - file might be in use or already deleted
    except Exception:
        pass  # Ignore directory read errors


def wrap_code_if_needed(code):
    """Wrap code in async function if not already wrapped"""
    # Check if code already has imports and async structure
    has_import = 'from patchright' in code or 'import patchright' in code
    has_async_main = 'async def main' in code or 'asyncio.run' in code

    # If it's already a complete script, return as-is
    if has_import and has_async_main:
        return code

    # If it's just Patchright commands, wrap in full template
    if not has_import:
        return f'''
import asyncio
import os
import sys
from pathlib import Path

# Add skill directory to path for helpers import
sys.path.insert(0, str(Path(__file__).parent.resolve()))

from patchright.async_api import async_playwright
from lib import helpers

# Extra headers from environment variables (if configured)
__extra_headers = helpers.get_extra_headers_from_env()


def get_context_options_with_headers(options=None):
    """
    Utility to merge environment headers into context options.
    Use when creating contexts with raw Patchright API instead of helpers.create_context().
    """
    if options is None:
        options = {{}}
    if not __extra_headers:
        return options

    merged_headers = {{**__extra_headers, **options.get('extra_http_headers', {{}})}}
    return {{**options, 'extra_http_headers': merged_headers}}


async def main():
    try:
        async with async_playwright() as p:
            {code}
    except Exception as error:
        print(f"❌ Automation error: {{error}}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
'''

    # If has import but no async wrapper
    if not has_async_main:
        return f'''
import asyncio
import sys

async def main():
    try:
        {code}
    except Exception as error:
        print(f"❌ Automation error: {{error}}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
'''

    return code


def main():
    """Main execution"""
    print("🎭 Patchright Skill - Universal Executor\n")

    # Clean up old temp files from previous runs
    cleanup_old_temp_files()

    # Check Patchright installation
    if not check_patchright_installed():
        installed = install_patchright()
        if not installed:
            sys.exit(1)

    # Get code to execute
    raw_code = get_code_to_execute()
    code = wrap_code_if_needed(raw_code)

    # Create temporary file for execution
    temp_file = SKILL_DIR / f".temp-execution-{os.getpid()}.py"

    try:
        # Write code to temp file
        with open(temp_file, 'w') as f:
            f.write(code)

        # Execute the code
        print("🚀 Starting automation...\n")
        result = subprocess.run(
            [sys.executable, str(temp_file)],
            cwd=SKILL_DIR
        )
        sys.exit(result.returncode)

    except Exception as error:
        print(f"❌ Execution failed: {error}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        # Clean up temp file
        try:
            if temp_file.exists():
                temp_file.unlink()
        except Exception:
            pass


if __name__ == "__main__":
    main()
