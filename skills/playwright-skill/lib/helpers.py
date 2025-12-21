# patchright-helpers.py
# Reusable utility functions for Patchright automation

import os
import json
import asyncio
import socket
from typing import Optional, List, Dict, Any


def get_extra_headers_from_env() -> Optional[Dict[str, str]]:
    """
    Parse extra HTTP headers from environment variables.
    Supports two formats:
    - PW_HEADER_NAME + PW_HEADER_VALUE: Single header (simple, common case)
    - PW_EXTRA_HEADERS: JSON object for multiple headers (advanced)
    Single header format takes precedence if both are set.
    Returns headers dict or None if none configured.
    """
    header_name = os.environ.get('PW_HEADER_NAME')
    header_value = os.environ.get('PW_HEADER_VALUE')

    if header_name and header_value:
        return {header_name: header_value}

    headers_json = os.environ.get('PW_EXTRA_HEADERS')
    if headers_json:
        try:
            parsed = json.loads(headers_json)
            if isinstance(parsed, dict):
                return parsed
            print("PW_EXTRA_HEADERS must be a JSON object, ignoring...")
        except json.JSONDecodeError as e:
            print(f"Failed to parse PW_EXTRA_HEADERS as JSON: {e}")

    return None


async def launch_browser(playwright, browser_type: str = 'chromium', options: Dict[str, Any] = None):
    """
    Launch browser with standard configuration.
    Note: Patchright only supports Chromium-based browsers.

    Args:
        playwright: The async_playwright instance
        browser_type: 'chromium' (firefox/webkit not supported in patchright)
        options: Additional launch options
    """
    if options is None:
        options = {}

    # For maximum stealth, patchright recommends:
    # - headless: False
    # - channel: "chrome" (if available)
    # - no_viewport: True (for persistent contexts)
    default_options = {
        'headless': os.environ.get('HEADLESS', 'false').lower() != 'true',
        'slow_mo': int(os.environ.get('SLOW_MO', '0')),
        'args': ['--no-sandbox', '--disable-setuid-sandbox']
    }

    if browser_type != 'chromium':
        print(f"⚠️ Warning: Patchright only supports Chromium. Using chromium instead of {browser_type}")

    merged_options = {**default_options, **options}
    return await playwright.chromium.launch(**merged_options)


async def create_context(browser, options: Dict[str, Any] = None):
    """
    Create browser context with common settings.
    Automatically merges environment headers.

    Args:
        browser: Browser instance
        options: Context options
    """
    if options is None:
        options = {}

    env_headers = get_extra_headers_from_env()

    # Merge environment headers with any passed in options
    merged_headers = {}
    if env_headers:
        merged_headers.update(env_headers)
    if options.get('extra_http_headers'):
        merged_headers.update(options['extra_http_headers'])

    default_options = {
        'viewport': {'width': 1280, 'height': 720},
        'locale': options.get('locale', 'en-US'),
        'timezone_id': options.get('timezone_id', 'America/New_York'),
    }

    if options.get('mobile'):
        default_options['user_agent'] = (
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) '
            'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
        )

    if options.get('permissions'):
        default_options['permissions'] = options['permissions']

    if options.get('geolocation'):
        default_options['geolocation'] = options['geolocation']

    # Only include extra_http_headers if we have any
    if merged_headers:
        default_options['extra_http_headers'] = merged_headers

    # Remove custom keys before merging
    clean_options = {k: v for k, v in options.items()
                     if k not in ('mobile', 'permissions', 'geolocation', 'locale', 'timezone_id')}

    return await browser.new_context(**{**default_options, **clean_options})


async def wait_for_page_ready(page, options: Dict[str, Any] = None):
    """
    Smart wait for page to be ready.

    Args:
        page: Patchright page
        options: Wait options (wait_until, timeout, wait_for_selector)
    """
    if options is None:
        options = {}

    wait_until = options.get('wait_until', 'networkidle')
    timeout = options.get('timeout', 30000)

    try:
        await page.wait_for_load_state(wait_until, timeout=timeout)
    except Exception:
        print("Page load timeout, continuing...")

    # Additional wait for dynamic content if selector provided
    if options.get('wait_for_selector'):
        await page.wait_for_selector(options['wait_for_selector'], timeout=timeout)


async def safe_click(page, selector: str, options: Dict[str, Any] = None) -> bool:
    """
    Safe click with retry logic.

    Args:
        page: Patchright page
        selector: Element selector
        options: Click options (retries, retry_delay, timeout, force)
    """
    if options is None:
        options = {}

    max_retries = options.get('retries', 3)
    retry_delay = options.get('retry_delay', 1000)
    timeout = options.get('timeout', 5000)
    force = options.get('force', False)

    for i in range(max_retries):
        try:
            await page.wait_for_selector(selector, state='visible', timeout=timeout)
            await page.click(selector, force=force, timeout=timeout)
            return True
        except Exception as e:
            if i == max_retries - 1:
                print(f"Failed to click {selector} after {max_retries} attempts")
                raise e
            print(f"Retry {i + 1}/{max_retries} for clicking {selector}")
            await asyncio.sleep(retry_delay / 1000)

    return False


async def safe_type(page, selector: str, text: str, options: Dict[str, Any] = None):
    """
    Safe text input with clear before type.

    Args:
        page: Patchright page
        selector: Input selector
        text: Text to type
        options: Type options (timeout, clear, slow, delay)
    """
    if options is None:
        options = {}

    timeout = options.get('timeout', 10000)

    await page.wait_for_selector(selector, state='visible', timeout=timeout)

    if options.get('clear', True):
        await page.fill(selector, '')

    if options.get('slow'):
        await page.type(selector, text, delay=options.get('delay', 100))
    else:
        await page.fill(selector, text)


async def extract_texts(page, selector: str) -> List[str]:
    """
    Extract text from multiple elements.

    Args:
        page: Patchright page
        selector: Elements selector
    """
    await page.wait_for_selector(selector, timeout=10000)
    elements = await page.query_selector_all(selector)
    texts = []
    for el in elements:
        text = await el.text_content()
        if text:
            texts.append(text.strip())
    return [t for t in texts if t]


async def take_screenshot(page, name: str, options: Dict[str, Any] = None) -> str:
    """
    Take screenshot with timestamp.

    Args:
        page: Patchright page
        name: Screenshot name
        options: Screenshot options (full_page, path)
    """
    if options is None:
        options = {}

    from datetime import datetime
    timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
    filename = options.get('path', f"{name}-{timestamp}.png")

    await page.screenshot(
        path=filename,
        full_page=options.get('full_page', True)
    )

    print(f"Screenshot saved: {filename}")
    return filename


async def authenticate(page, credentials: Dict[str, str], selectors: Dict[str, str] = None):
    """
    Handle authentication.

    Args:
        page: Patchright page
        credentials: Dict with 'username' and 'password'
        selectors: Login form selectors (username, password, submit, success_indicator)
    """
    default_selectors = {
        'username': 'input[name="username"], input[name="email"], #username, #email',
        'password': 'input[name="password"], #password',
        'submit': 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
    }

    final_selectors = {**default_selectors, **(selectors or {})}

    await safe_type(page, final_selectors['username'], credentials['username'])
    await safe_type(page, final_selectors['password'], credentials['password'])
    await safe_click(page, final_selectors['submit'])

    # Wait for navigation or success indicator
    success_selector = (selectors or {}).get('success_indicator', '.dashboard, .user-menu, .logout')
    try:
        await asyncio.wait_for(
            asyncio.gather(
                page.wait_for_url('**/*', wait_until='networkidle'),
                return_exceptions=True
            ),
            timeout=10
        )
    except asyncio.TimeoutError:
        print("Login might have completed without navigation")


async def scroll_page(page, direction: str = 'down', distance: int = 500):
    """
    Scroll page.

    Args:
        page: Patchright page
        direction: 'down', 'up', 'top', 'bottom'
        distance: Pixels to scroll (for up/down)
    """
    if direction == 'down':
        await page.evaluate(f'window.scrollBy(0, {distance})')
    elif direction == 'up':
        await page.evaluate(f'window.scrollBy(0, -{distance})')
    elif direction == 'top':
        await page.evaluate('window.scrollTo(0, 0)')
    elif direction == 'bottom':
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')

    await asyncio.sleep(0.5)  # Wait for scroll animation


async def extract_table_data(page, table_selector: str) -> Optional[Dict[str, Any]]:
    """
    Extract table data.

    Args:
        page: Patchright page
        table_selector: Table selector
    """
    await page.wait_for_selector(table_selector)

    return await page.evaluate('''(selector) => {
        const table = document.querySelector(selector);
        if (!table) return null;

        const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
            th.textContent?.trim()
        );

        const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
            const cells = Array.from(tr.querySelectorAll('td'));
            if (headers.length > 0) {
                return cells.reduce((obj, cell, index) => {
                    obj[headers[index] || `column_${index}`] = cell.textContent?.trim();
                    return obj;
                }, {});
            } else {
                return cells.map(cell => cell.textContent?.trim());
            }
        });

        return { headers, rows };
    }''', table_selector)


async def handle_cookie_banner(page, timeout: int = 3000) -> bool:
    """
    Wait for and dismiss cookie banners.

    Args:
        page: Patchright page
        timeout: Max time to wait
    """
    common_selectors = [
        'button:has-text("Accept")',
        'button:has-text("Accept all")',
        'button:has-text("OK")',
        'button:has-text("Got it")',
        'button:has-text("I agree")',
        '.cookie-accept',
        '#cookie-accept',
        '[data-testid="cookie-accept"]'
    ]

    selector_timeout = timeout // len(common_selectors)

    for selector in common_selectors:
        try:
            element = await page.wait_for_selector(
                selector,
                timeout=selector_timeout,
                state='visible'
            )
            if element:
                await element.click()
                print("Cookie banner dismissed")
                return True
        except Exception:
            continue

    return False


async def retry_with_backoff(fn, max_retries: int = 3, initial_delay: float = 1.0):
    """
    Retry a function with exponential backoff.

    Args:
        fn: Async function to retry
        max_retries: Maximum retry attempts
        initial_delay: Initial delay in seconds
    """
    last_error = None

    for i in range(max_retries):
        try:
            return await fn()
        except Exception as error:
            last_error = error
            delay = initial_delay * (2 ** i)
            print(f"Attempt {i + 1} failed, retrying in {delay}s...")
            await asyncio.sleep(delay)

    raise last_error


async def detect_dev_servers(custom_ports: List[int] = None) -> List[str]:
    """
    Detect running dev servers on common ports.

    Args:
        custom_ports: Additional ports to check

    Returns:
        List of detected server URLs
    """
    if custom_ports is None:
        custom_ports = []

    # Common dev server ports
    common_ports = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234]
    all_ports = list(set(common_ports + custom_ports))

    detected_servers = []

    print("🔍 Checking for running dev servers...")

    for port in all_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex(('localhost', port))
            sock.close()

            if result == 0:
                detected_servers.append(f"http://localhost:{port}")
                print(f"  ✅ Found server on port {port}")
        except Exception:
            continue

    if not detected_servers:
        print("  ❌ No dev servers detected")

    return detected_servers


# Synchronous version of detect_dev_servers for CLI usage
def detect_dev_servers_sync(custom_ports: List[int] = None) -> List[str]:
    """
    Detect running dev servers on common ports (synchronous version).

    Args:
        custom_ports: Additional ports to check

    Returns:
        List of detected server URLs
    """
    if custom_ports is None:
        custom_ports = []

    common_ports = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234]
    all_ports = list(set(common_ports + custom_ports))

    detected_servers = []

    print("🔍 Checking for running dev servers...")

    for port in all_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex(('localhost', port))
            sock.close()

            if result == 0:
                detected_servers.append(f"http://localhost:{port}")
                print(f"  ✅ Found server on port {port}")
        except Exception:
            continue

    if not detected_servers:
        print("  ❌ No dev servers detected")

    return detected_servers


# Import proxy wrapper functions
try:
    from .proxy_wrapper import (
        is_claude_code_web_environment,
        get_proxy_config,
        get_browser_config,
        start_proxy_wrapper,
        stop_proxy_wrapper,
    )
    _PROXY_WRAPPER_AVAILABLE = True
except ImportError:
    _PROXY_WRAPPER_AVAILABLE = False
    # Provide stub functions if import fails
    def is_claude_code_web_environment():
        return False

    def get_proxy_config():
        return None

    def get_browser_config(headless=None, verbose=True):
        config = {
            'launch_options': {'args': ['--no-sandbox', '--disable-setuid-sandbox']},
            'context_options': {},
            'proxy_wrapper_used': False
        }
        if headless is not None:
            config['launch_options']['headless'] = headless
        return config

    def start_proxy_wrapper(proxy_config, verbose=True):
        return None

    def stop_proxy_wrapper():
        pass


__all__ = [
    'get_extra_headers_from_env',
    'launch_browser',
    'create_context',
    'wait_for_page_ready',
    'safe_click',
    'safe_type',
    'extract_texts',
    'take_screenshot',
    'authenticate',
    'scroll_page',
    'extract_table_data',
    'handle_cookie_banner',
    'retry_with_backoff',
    'detect_dev_servers',
    'detect_dev_servers_sync',
    'is_claude_code_web_environment',
    'get_proxy_config',
    'get_browser_config',
    'start_proxy_wrapper',
    'stop_proxy_wrapper',
]
