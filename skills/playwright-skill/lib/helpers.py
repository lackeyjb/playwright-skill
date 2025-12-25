#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
#     "aiohttp>=3.9.0",
# ]
# ///
"""
Reusable utility functions for Playwright automation
"""

import os
import sys
import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from playwright.sync_api import Browser, Page, BrowserContext


def get_extra_headers_from_env() -> Optional[Dict[str, str]]:
    """
    Parse extra HTTP headers from environment variables.
    Supports two formats:
    - PW_HEADER_NAME + PW_HEADER_VALUE: Single header (simple, common case)
    - PW_EXTRA_HEADERS: JSON object for multiple headers (advanced)
    Single header format takes precedence if both are set.
    """
    header_name = os.environ.get("PW_HEADER_NAME")
    header_value = os.environ.get("PW_HEADER_VALUE")

    if header_name and header_value:
        return {header_name: header_value}

    headers_json = os.environ.get("PW_EXTRA_HEADERS")
    if headers_json:
        try:
            parsed = json.loads(headers_json)
            if isinstance(parsed, dict) and not isinstance(parsed, list):
                return parsed
            print(
                "⚠️  PW_EXTRA_HEADERS must be a JSON object, ignoring...",
                file=sys.stderr,
            )
        except json.JSONDecodeError as e:
            print(f"⚠️  Failed to parse PW_EXTRA_HEADERS as JSON: {e}", file=sys.stderr)

    return None


def launch_browser(browser_type: str = "chromium", **options) -> Browser:
    """
    Launch browser with standard configuration.
    """
    from playwright.sync_api import sync_playwright

    default_options = {
        "headless": os.environ.get("HEADLESS", "true").lower() != "false",
        "slow_mo": int(os.environ.get("SLOW_MO", 0)),
        "args": ["--no-sandbox", "--disable-setuid-sandbox"],
    }

    merged_options = {**default_options, **options}
    browsers = {
        "chromium": sync_playwright().start().chromium,
        "firefox": sync_playwright().start().firefox,
        "webkit": sync_playwright().start().webkit,
    }

    if browser_type not in browsers:
        raise ValueError(f"Invalid browser type: {browser_type}")

    return browsers[browser_type].launch(**merged_options)


def create_page(context: BrowserContext, **options) -> Page:
    """
    Create a new page with viewport and user agent.
    """
    page = context.new_page()

    if "viewport" in options:
        page.set_viewport_size(options["viewport"])

    if "user_agent" in options:
        page.set_extra_http_headers({"User-Agent": options["user_agent"]})

    # Set default timeout
    page.set_default_timeout(options.get("timeout", 30000))

    return page


def wait_for_page_ready(page: Page, **options):
    """
    Smart wait for page to be ready.
    """
    wait_options = {
        "wait_until": options.get("wait_until", "networkidle"),
        "timeout": options.get("timeout", 30000),
    }

    try:
        page.wait_for_load_state(
            wait_options["wait_until"], timeout=wait_options["timeout"]
        )
    except Exception:
        print("⚠️  Page load timeout, continuing...", file=sys.stderr)

    # Additional wait for dynamic content if selector provided
    if "wait_for_selector" in options:
        page.wait_for_selector(
            options["wait_for_selector"], timeout=options.get("timeout", 30000)
        )


def safe_click(page: Page, selector: str, **options) -> bool:
    """
    Safe click with retry logic.
    """
    max_retries = options.get("retries", 3)
    retry_delay = options.get("retry_delay", 1000)

    for i in range(max_retries):
        try:
            page.wait_for_selector(
                selector, state="visible", timeout=options.get("timeout", 5000)
            )
            page.click(
                selector,
                force=options.get("force", False),
                timeout=options.get("timeout", 5000),
            )
            return True
        except Exception as e:
            if i == max_retries - 1:
                print(
                    f"❌ Failed to click {selector} after {max_retries} attempts",
                    file=sys.stderr,
                )
                raise e
            print(f"Retry {i + 1}/{max_retries} for clicking {selector}")
            page.wait_for_timeout(retry_delay)
    return False


def safe_type(page: Page, selector: str, text: str, **options):
    """
    Safe text input with clear before type.
    """
    page.wait_for_selector(
        selector, state="visible", timeout=options.get("timeout", 10000)
    )

    if options.get("clear", True):
        page.fill(selector, "")

    if options.get("slow", False):
        page.type(selector, text, delay=options.get("delay", 100))
    else:
        page.fill(selector, text)


def extract_texts(page: Page, selector: str) -> List[str]:
    """
    Extract text from multiple elements.
    """
    page.wait_for_selector(selector, timeout=10000)
    return page.locator(selector).all_text_contents()


def take_screenshot(page: Page, name: str, **options) -> str:
    """
    Take screenshot with timestamp.
    """
    timestamp = datetime.now().isoformat().replace(":", "-").replace(".", "-")
    filename = f"{name}-{timestamp}.png"

    page.screenshot(path=filename, full_page=options.get("full_page", True), **options)

    print(f"📸 Screenshot saved: {filename}")
    return filename


def authenticate(
    page: Page, credentials: Dict[str, str], selectors: Optional[Dict[str, str]] = None
):
    """
    Handle authentication.
    """
    default_selectors = {
        "username": 'input[name="username"], input[name="email"], #username, #email',
        "password": 'input[name="password"], #password',
        "submit": 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
    }

    final_selectors = {**default_selectors, **(selectors or {})}

    safe_type(page, final_selectors["username"], credentials["username"])
    safe_type(page, final_selectors["password"], credentials["password"])
    safe_click(page, final_selectors["submit"])

    # Wait for navigation or success indicator
    try:
        page.wait_for_navigation(wait_until="networkidle", timeout=5000)
    except:
        final_selectors = {**default_selectors, **(selectors or {})}
        page.wait_for_selector(
            final_selectors.get("success_indicator", ".dashboard, .user-menu, .logout"),
            timeout=5000,
        )
        print("Login might have completed without navigation")


def scroll_page(page: Page, direction: str = "down", distance: int = 500):
    """
    Scroll page.
    """
    if direction == "down":
        page.evaluate(f"window.scrollBy(0, {distance})")
    elif direction == "up":
        page.evaluate(f"window.scrollBy(0, -{distance})")
    elif direction == "top":
        page.evaluate("window.scrollTo(0, 0)")
    elif direction == "bottom":
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    page.wait_for_timeout(500)  # Wait for scroll animation


def extract_table_data(page: Page, table_selector: str) -> Optional[Dict[str, Any]]:
    """
    Extract table data.
    """
    page.wait_for_selector(table_selector)

    return page.evaluate(
        f"""
        (selector) => {{
            const table = document.querySelector(selector);
            if (!table) return null;

            const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
                th.textContent?.trim()
            );

            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {{
                const cells = Array.from(tr.querySelectorAll('td'));
                if (headers.length > 0) {{
                    return cells.reduce((obj, cell, index) => {{
                        obj[headers[index] || `column_${index}`] = cell.textContent?.trim();
                        return obj;
                    }}, {{}});
                }} else {{
                    return cells.map(cell => cell.textContent?.trim());
                }}
            }});

            return {{ headers, rows }};
        }}
    """,
        table_selector,
    )


def handle_cookie_banner(page: Page, timeout: int = 3000) -> bool:
    """
    Wait for and dismiss cookie banners.
    """
    common_selectors = [
        'button:has-text("Accept")',
        'button:has-text("Accept all")',
        'button:has-text("OK")',
        'button:has-text("Got it")',
        'button:has-text("I agree")',
        ".cookie-accept",
        "#cookie-accept",
        '[data-testid="cookie-accept"]',
    ]

    for selector in common_selectors:
        try:
            page.wait_for_selector(
                selector, timeout=timeout // len(common_selectors), state="visible"
            )
            page.click(selector)
            print("🍪 Cookie banner dismissed")
            return True
        except:
            pass

    return False


async def retry_with_backoff(fn, max_retries: int = 3, initial_delay: int = 1000):
    """
    Retry a function with exponential backoff.
    """
    last_error = Exception("Max retries exceeded")

    for i in range(max_retries):
        try:
            return await fn()
        except Exception as error:
            last_error = error
            delay = initial_delay * (2**i)
            print(f"Attempt {i + 1} failed, retrying in {delay}ms...")
            await asyncio.sleep(delay / 1000)

    raise last_error


def create_context(browser: Browser, **options) -> BrowserContext:
    """
    Create browser context with common settings.
    """
    env_headers = get_extra_headers_from_env() or {}

    # Merge environment headers with any passed in options
    merged_headers = {**env_headers, **options.get("extra_http_headers", {})}

    default_options = {
        "viewport": {"width": 1280, "height": 720},
        "locale": "en-US",
        "timezone_id": "America/New_York",
    }

    # Only include extra_http_headers if we have any
    if merged_headers:
        default_options["extra_http_headers"] = merged_headers

    return browser.new_context(**{**default_options, **options})


async def detect_dev_servers(custom_ports: Optional[List[int]] = None) -> List[str]:
    """
    Detect running dev servers on common ports.
    """
    if custom_ports is None:
        custom_ports = []

    common_ports = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234]
    all_ports = sorted(set(common_ports + custom_ports))
    detected_servers = []

    print("🔍 Checking for running dev servers...")

    async def check_port(port: int) -> Optional[str]:
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
        if isinstance(result, str):
            detected_servers.append(result)
            print(f"  ✅ Found server on port {result.split(':')[2]}")

    if not detected_servers:
        print("  ❌ No dev servers detected")

    return detected_servers


def get_context_options_with_headers(
    options: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Merge environment headers into context options.
    Use when creating contexts with raw Playwright API instead of create_context().
    """
    if options is None:
        options = {}

    extra_headers = get_extra_headers_from_env()
    if not extra_headers:
        return options

    return {
        **options,
        "extra_http_headers": {
            **extra_headers,
            **options.get("extra_http_headers", {}),
        },
    }
