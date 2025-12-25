---
name: playwright-skill
description: Complete browser automation with Playwright. Auto-detects dev servers, writes clean test scripts to /tmp. Test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links, automate any browser task. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform any browser-based testing.
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:

- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

# Playwright Browser Automation

General-purpose browser automation skill. I'll write custom Playwright code for any automation task you request and execute it via the universal executor.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:

   ```bash
   cd $SKILL_DIR && uv run python -c "from lib.helpers import detect_dev_servers; import asyncio, json; print(json.dumps(asyncio.run(detect_dev_servers())))"
   ```

   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/playwright-test-*.py`

3. **Use visible browser by default** - Always use `headless=False` unless user specifically requests headless mode

4. **Parameterize URLs** - Always make URLs configurable via environment variable or constant at top of script

## How It Works

1. You describe what you want to test/automate
2. I auto-detect running dev servers (or ask for URL if testing external site)
3. I write custom Playwright code in `/tmp/playwright-test-*.py` (won't clutter your project)
4. I execute it via: `cd $SKILL_DIR && uv run run.py /tmp/playwright-test-*.py`
5. Results displayed in real-time, browser window visible for debugging
6. Test files auto-cleaned from /tmp by your OS

## Setup (First Time)

```bash
cd $SKILL_DIR
uv run run.py --help
```

This will automatically install Playwright via PEP 723 metadata. Chromium browser must already be installed (correct version for Playwright 1.54.0).

## Execution Pattern

**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && uv run python -c "from lib.helpers import detect_dev_servers; import asyncio, json; print(json.dumps(asyncio.run(detect_dev_servers())))"
```

**Step 2: Write test script to /tmp with URL parameter**

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
# /tmp/playwright-test-page.py
from playwright.sync_api import sync_playwright

# Parameterized URL (detected or user-provided)
TARGET_URL = 'http://localhost:3001'  # <-- Auto-detected or from user

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto(TARGET_URL)
    print('Page loaded:', page.title())

    page.screenshot(path='/tmp/screenshot.png', full_page=True)
    print('📸 Screenshot saved to /tmp/screenshot.png')

    browser.close()
```

**Step 3: Execute from skill directory**

```bash
cd $SKILL_DIR && uv run run.py /tmp/playwright-test-page.py
```

## Common Patterns

### Test a Page (Multiple Viewports)

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
# /tmp/playwright-test-responsive.py
from playwright.sync_api import sync_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=100)
    page = browser.new_page()

    # Desktop test
    page.set_viewport_size({'width': 1920, 'height': 1080})
    page.goto(TARGET_URL)
    print('Desktop - Title:', page.title())
    page.screenshot(path='/tmp/desktop.png', full_page=True)

    # Mobile test
    page.set_viewport_size({'width': 375, 'height': 667})
    page.screenshot(path='/tmp/mobile.png', full_page=True)

    browser.close()
```

### Test Login Flow

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
# /tmp/playwright-test-login.py
from playwright.sync_api import sync_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto(f'{TARGET_URL}/login')

    page.fill('input[name="email"]', 'test@example.com')
    page.fill('input[name="password"]', 'password123')
    page.click('button[type="submit"]')

    # Wait for redirect
    page.wait_for_url('**/dashboard')
    print('✅ Login successful, redirected to dashboard')

    browser.close()
```

### Fill and Submit Form

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
# /tmp/playwright-test-form.py
from playwright.sync_api import sync_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=50)
    page = browser.new_page()

    page.goto(f'{TARGET_URL}/contact')

    page.fill('input[name="name"]', 'John Doe')
    page.fill('input[name="email"]', 'john@example.com')
    page.fill('textarea[name="message"]', 'Test message')
    page.click('button[type="submit"]')

    # Verify submission
    page.wait_for_selector('.success-message')
    print('✅ Form submitted successfully')

    browser.close()
```

### Check for Broken Links

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto('http://localhost:3000')

    links = page.locator('a[href^="http"]').all()
    results = {'working': 0, 'broken': []}

    for link in links:
        href = link.get_attribute('href')
        try:
            response = page.request.head(href)
            if response.ok:
                results['working'] += 1
            else:
                results['broken'].append({'url': href, 'status': response.status})
        except Exception as e:
            results['broken'].append({'url': href, 'error': str(e)})

    print(f'✅ Working links: {results["working"]}')
    print(f'❌ Broken links:', results['broken'])

    browser.close()
```

### Take Screenshot with Error Handling

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    try:
        page.goto('http://localhost:3000', wait_until='networkidle', timeout=10000)

        page.screenshot(path='/tmp/screenshot.png', full_page=True)

        print('📸 Screenshot saved to /tmp/screenshot.png')
    except Exception as error:
        print(f'❌ Error: {error}')
    finally:
        browser.close()
```

### Test Responsive Design

```python
#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright==1.54.0",
# ]
# ///
# /tmp/playwright-test-responsive-full.py
from playwright.sync_api import sync_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    viewports = [
        {'name': 'Desktop', 'width': 1920, 'height': 1080},
        {'name': 'Tablet', 'width': 768, 'height': 1024},
        {'name': 'Mobile', 'width': 375, 'height': 667},
    ]

    for viewport in viewports:
        print(f'Testing {viewport["name"]} ({viewport["width"]}x{viewport["height"]})')

        page.set_viewport_size({'width': viewport['width'], 'height': viewport['height']})

        page.goto(TARGET_URL)
        page.wait_for_timeout(1000)

        page.screenshot(path=f'/tmp/{viewport["name"].lower()}.png', full_page=True)

    print('✅ All viewports tested')
    browser.close()
```

## Inline Execution (Simple Tasks)

For quick one-off tasks, you can execute code inline without creating files:

```bash
# Take a quick screenshot
cd $SKILL_DIR && uv run run.py "
with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto('http://localhost:3001')
    page.screenshot(path='/tmp/quick-screenshot.png', full_page=True)
    print('Screenshot saved')
    browser.close()
"
```

**When to use inline vs files:**

- **Inline**: Quick one-off tasks (screenshot, check if element exists, get page title)
- **Files**: Complex tests, responsive design checks, anything user might want to re-run

## Available Helpers

Optional utility functions in `lib/helpers.py`:

```python
from lib.helpers import *

# Detect running dev servers (CRITICAL - use this first!)
servers = await detect_dev_servers()
print('Found servers:', servers)

# Safe click with retry
safe_click(page, 'button.submit', retries=3)

# Safe type with clear
safe_type(page, '#username', 'testuser')

# Take timestamped screenshot
take_screenshot(page, 'test-result')

# Handle cookie banners
handle_cookie_banner(page)

# Extract table data
data = extract_table_data(page, 'table.results')
```

See `lib/helpers.py` for full list.

## Custom HTTP Headers

Configure custom headers for all HTTP requests via environment variables. Useful for:

- Identifying automated traffic to your backend
- Getting LLM-optimized responses (e.g., plain text errors instead of styled HTML)
- Adding authentication tokens globally

### Configuration

**Single header (common case):**

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  cd $SKILL_DIR && uv run run.py /tmp/my-script.py
```

**Multiple headers (JSON format):**

```bash
PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Debug":"true"}' \
  cd $SKILL_DIR && uv run run.py /tmp/my-script.py
```

### How It Works

Headers are automatically applied when using `create_context()`:

```python
context = create_context(browser)
page = context.new_page()
# All requests from this page include your custom headers
```

For scripts using raw Playwright API, use the `get_context_options_with_headers()`:

```python
context = browser.new_context(
    get_context_options_with_headers({'viewport': {'width': 1920, 'height': 1080}})
)
```

## Advanced Usage

For comprehensive Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):

- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques
- CI/CD integration

## Tips

- **CRITICAL: Detect servers FIRST** - Always run `detect_dev_servers()` before writing test code for localhost testing
- **Custom headers** - Use `PW_HEADER_NAME`/`PW_HEADER_VALUE` env vars to identify automated traffic to your backend
- **Use /tmp for test files** - Write to `/tmp/playwright-test-*.py`, never to skill directory or user's project
- **Parameterize URLs** - Put detected/provided URL in a `TARGET_URL` constant at the top of every script
- **DEFAULT: Visible browser** - Always use `headless=False` unless user explicitly asks for headless mode
- **Headless mode** - Only use `headless=True` when user specifically requests "headless" or "background" execution
- **Slow down:** Use `slow_mo=100` to make actions visible and easier to follow
- **Wait strategies:** Use `wait_for_url`, `wait_for_selector`, `wait_for_load_state` instead of fixed timeouts
- **Error handling:** Always use try-catch for robust automation
- **Console output:** Use `print()` to track progress and show what's happening

## Troubleshooting

**Playwright not installed:**

```bash
cd $SKILL_DIR && uv run run.py --help
# This will auto-install playwright==1.54.0 via PEP 723
```

**Module not found:**
Ensure running from skill directory via `run.py` wrapper

**Browser doesn't open:**
Check `headless=False` and ensure display available

**Element not found:**
Add wait: `page.wait_for_selector('.element', timeout=10000)`

## Example Usage

```
User: "Test if the marketing page looks good"

Claude: I'll test the marketing page across multiple viewports. Let me first detect running servers...
[Runs: detect_dev_servers()]
[Output: Found server on port 3001]
I found your dev server running on http://localhost:3001

[Writes custom automation script to /tmp/playwright-test-marketing.py with URL parameterized]
[Runs: cd $SKILL_DIR && uv run run.py /tmp/playwright-test-marketing.py]
[Shows results with screenshots from /tmp/]
```

```
User: "Check if login redirects correctly"

Claude: I'll test the login flow. First, let me check for running servers...
[Runs: detect_dev_servers()]
[Output: Found servers on ports 3000 and 3001]
I found 2 dev servers. Which one should I test?
- http://localhost:3000
- http://localhost:3001

User: "Use 3001"

[Writes login automation to /tmp/playwright-test-login.py]
[Runs: cd $SKILL_DIR && uv run run.py /tmp/playwright-test-login.py]
[Reports: ✅ Login successful, redirected to /dashboard]
```

## Notes

- Each automation is custom-written for your specific request
- Not limited to pre-built scripts - any browser task possible
- Auto-detects running dev servers to eliminate hardcoded URLs
- Test scripts written to `/tmp` for automatic cleanup (no clutter)
- Code executes reliably with proper module resolution via `run.py`
- Progressive disclosure - API_REFERENCE.md loaded only when advanced features needed
- Chromium browser must be installed separately (correct version for Playwright 1.54.0)
