---
name: patchright-skill
description: Undetected browser automation with Patchright (Playwright fork). Auto-detects dev servers, writes clean test scripts to /tmp. Test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links, automate any browser task. Bypasses bot detection. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform any browser-based testing.
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:

- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

# Patchright Browser Automation

General-purpose browser automation skill using **Patchright** - an undetected fork of Playwright that bypasses bot detection (Cloudflare, Akamai, DataDome, etc.).

I'll write custom Patchright code for any automation task you request and execute it via the universal executor.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:

   ```bash
   cd $SKILL_DIR && python3 -c "from lib.helpers import detect_dev_servers_sync; import json; print(json.dumps(detect_dev_servers_sync()))"
   ```

   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/patchright-test-*.py`

3. **Use visible browser by default** - Always use `headless=False` unless user specifically requests headless mode

4. **Parameterize URLs** - Always make URLs configurable via constant at top of script

## How It Works

1. You describe what you want to test/automate
2. I auto-detect running dev servers (or ask for URL if testing external site)
3. I write custom Patchright code in `/tmp/patchright-test-*.py` (won't clutter your project)
4. I execute it via: `cd $SKILL_DIR && python3 run.py /tmp/patchright-test-*.py`
5. Results displayed in real-time, browser window visible for debugging
6. Test files auto-cleaned from /tmp by your OS

## Claude Code Web Environment Auto-Configuration

When running in **Claude Code for Web** environments, the skill automatically:

✅ **Detects the environment** - Uses official `CLAUDE_CODE_REMOTE` environment variable to detect web sessions
✅ **Starts proxy wrapper** - Automatically launches authentication wrapper on `127.0.0.1:18080`
✅ **Configures browser** - Prefers Chrome over Chromium for better stealth, sets up proxy, headless mode, and certificate handling
✅ **Enables external sites** - Full internet access through authenticated proxy

**No configuration needed** - just use the skill normally:

```python
from lib.helpers import get_browser_config

# Automatically configures for current environment
config = get_browser_config()

browser = await p.chromium.launch(**config['launch_options'])
context = await browser.new_context(**config['context_options'])
```

The skill transparently handles:
- JWT proxy authentication (adds `Proxy-Authorization` headers)
- Headless mode (automatically enabled in web environments)
- Certificate validation (bypassed for proxy connections)
- HTTPS tunnel establishment (via local wrapper)
- Chrome preference (uses Chrome if available, falls back to Chromium for better bot detection avoidance)

**For external websites in Claude Code web:**
```python
# Just write normal code - proxy wrapper handles authentication
async with async_playwright() as p:
    config = get_browser_config()
    browser = await p.chromium.launch(**config['launch_options'])
    context = await browser.new_context(**config['context_options'])
    page = await context.new_page()

    # Works with any external site
    await page.goto('https://github.com')
    await page.screenshot(path='/tmp/screenshot.png')
```

**Manual control** (if needed):
```python
from lib.helpers import is_claude_code_web_environment, get_browser_config

if is_claude_code_web_environment():
    print("Running in Claude Code web - auto-config enabled")

# Override headless setting
config = get_browser_config(headless=False)  # Force visible browser

# Use Chromium instead of Chrome (not recommended for production)
config = get_browser_config(use_chrome=False)  # Disable Chrome preference
```

## Setup (First Time)

```bash
cd $SKILL_DIR
uv pip install patchright
uv run patchright install chrome  # Recommended for better stealth
# Or: uv run patchright install chromium  # Fallback option
```

This installs Patchright and Chrome browser. Only needed once.

**Recommended:** Install Chrome instead of Chromium for better bot detection avoidance and stealth.

**Note:** If you have Playwright already installed, Patchright shares the browser binaries.

## Execution Pattern

**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && python3 -c "from lib.helpers import detect_dev_servers_sync; import json; print(json.dumps(detect_dev_servers_sync()))"
```

**Step 2: Write test script to /tmp with URL parameter**

```python
# /tmp/patchright-test-page.py
import asyncio
from patchright.async_api import async_playwright

# Parameterized URL (detected or user-provided)
TARGET_URL = 'http://localhost:3001'  # <-- Auto-detected or from user

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        await page.goto(TARGET_URL)
        print('Page loaded:', await page.title())

        await page.screenshot(path='/tmp/screenshot.png', full_page=True)
        print('📸 Screenshot saved to /tmp/screenshot.png')

        await browser.close()

asyncio.run(main())
```

**Step 3: Execute from skill directory**

```bash
cd $SKILL_DIR && python3 run.py /tmp/patchright-test-page.py
```

## Common Patterns

### Test a Page (Multiple Viewports)

```python
# /tmp/patchright-test-responsive.py
import asyncio
from patchright.async_api import async_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=100)
        page = await browser.new_page()

        # Desktop test
        await page.set_viewport_size({'width': 1920, 'height': 1080})
        await page.goto(TARGET_URL)
        print('Desktop - Title:', await page.title())
        await page.screenshot(path='/tmp/desktop.png', full_page=True)

        # Mobile test
        await page.set_viewport_size({'width': 375, 'height': 667})
        await page.screenshot(path='/tmp/mobile.png', full_page=True)

        await browser.close()

asyncio.run(main())
```

### Test Login Flow

```python
# /tmp/patchright-test-login.py
import asyncio
from patchright.async_api import async_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        await page.goto(f'{TARGET_URL}/login')

        await page.fill('input[name="email"]', 'test@example.com')
        await page.fill('input[name="password"]', 'password123')
        await page.click('button[type="submit"]')

        # Wait for redirect
        await page.wait_for_url('**/dashboard')
        print('✅ Login successful, redirected to dashboard')

        await browser.close()

asyncio.run(main())
```

### Fill and Submit Form

```python
# /tmp/patchright-test-form.py
import asyncio
from patchright.async_api import async_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=50)
        page = await browser.new_page()

        await page.goto(f'{TARGET_URL}/contact')

        await page.fill('input[name="name"]', 'John Doe')
        await page.fill('input[name="email"]', 'john@example.com')
        await page.fill('textarea[name="message"]', 'Test message')
        await page.click('button[type="submit"]')

        # Verify submission
        await page.wait_for_selector('.success-message')
        print('✅ Form submitted successfully')

        await browser.close()

asyncio.run(main())
```

### Check for Broken Links

```python
# /tmp/patchright-test-links.py
import asyncio
from patchright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        await page.goto('http://localhost:3000')

        links = await page.locator('a[href^="http"]').all()
        results = {'working': 0, 'broken': []}

        for link in links:
            href = await link.get_attribute('href')
            try:
                response = await page.request.head(href)
                if response.ok:
                    results['working'] += 1
                else:
                    results['broken'].append({'url': href, 'status': response.status})
            except Exception as e:
                results['broken'].append({'url': href, 'error': str(e)})

        print(f"✅ Working links: {results['working']}")
        print(f"❌ Broken links: {results['broken']}")

        await browser.close()

asyncio.run(main())
```

### Take Screenshot with Error Handling

```python
# /tmp/patchright-test-screenshot.py
import asyncio
from patchright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        try:
            await page.goto('http://localhost:3000', wait_until='networkidle', timeout=10000)
            await page.screenshot(path='/tmp/screenshot.png', full_page=True)
            print('📸 Screenshot saved to /tmp/screenshot.png')
        except Exception as error:
            print(f'❌ Error: {error}')
        finally:
            await browser.close()

asyncio.run(main())
```

### Test Responsive Design

```python
# /tmp/patchright-test-responsive-full.py
import asyncio
from patchright.async_api import async_playwright

TARGET_URL = 'http://localhost:3001'  # Auto-detected

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        viewports = [
            {'name': 'Desktop', 'width': 1920, 'height': 1080},
            {'name': 'Tablet', 'width': 768, 'height': 1024},
            {'name': 'Mobile', 'width': 375, 'height': 667}
        ]

        for viewport in viewports:
            print(f"Testing {viewport['name']} ({viewport['width']}x{viewport['height']})")

            await page.set_viewport_size({
                'width': viewport['width'],
                'height': viewport['height']
            })

            await page.goto(TARGET_URL)
            await asyncio.sleep(1)

            await page.screenshot(
                path=f"/tmp/{viewport['name'].lower()}.png",
                full_page=True
            )

        print('✅ All viewports tested')
        await browser.close()

asyncio.run(main())
```

## Inline Execution (Simple Tasks)

For quick one-off tasks, you can execute code inline without creating files:

```bash
# Take a quick screenshot
cd $SKILL_DIR && python3 run.py "
browser = await p.chromium.launch(headless=False)
page = await browser.new_page()
await page.goto('http://localhost:3001')
await page.screenshot(path='/tmp/quick-screenshot.png', full_page=True)
print('Screenshot saved')
await browser.close()
"
```

**When to use inline vs files:**

- **Inline**: Quick one-off tasks (screenshot, check if element exists, get page title)
- **Files**: Complex tests, responsive design checks, anything user might want to re-run

## Available Helpers

Optional utility functions in `lib/helpers.py`:

```python
import sys
sys.path.insert(0, '$SKILL_DIR')
from lib import helpers

# Detect running dev servers (CRITICAL - use this first!)
servers = await helpers.detect_dev_servers()
print('Found servers:', servers)

# Launch browser with standard config
browser = await helpers.launch_browser(p)

# Create context with environment headers
context = await helpers.create_context(browser)
page = await context.new_page()

# Safe click with retry
await helpers.safe_click(page, 'button.submit', {'retries': 3})

# Safe type with clear
await helpers.safe_type(page, '#username', 'testuser')

# Take timestamped screenshot
await helpers.take_screenshot(page, 'test-result')

# Handle cookie banners
await helpers.handle_cookie_banner(page)

# Extract table data
data = await helpers.extract_table_data(page, 'table.results')
```

See `lib/helpers.py` for full list.

## Content Extraction with Trafilatura

Extract clean, structured content from web pages using Trafilatura integration. Perfect for scraping articles, documentation, or any text-heavy content while filtering out navigation, ads, and boilerplate.

### Quick Examples

```python
import sys
sys.path.insert(0, '$SKILL_DIR')
from lib.helpers import extract_markdown, extract_text, extract_with_metadata

# Extract as Markdown (preserves formatting, links, tables)
markdown = await extract_markdown(page)
print(markdown)

# Extract as plain text (clean text only)
text = await extract_text(page)
print(text)

# Extract with metadata (title, author, date, etc.)
data = await extract_with_metadata(page)
print(f"Title: {data['title']}")
print(f"Author: {data['author']}")
print(f"Date: {data['date']}")
print(f"Content: {data['text']}")
```

### Full Script Example

```python
# /tmp/patchright-extract-content.py
import asyncio
from patchright.async_api import async_playwright
import sys
sys.path.insert(0, '$SKILL_DIR')
from lib.helpers import extract_markdown, extract_with_metadata

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        # Navigate to article/documentation page
        await page.goto('https://example.com/blog/article')

        # Extract as markdown
        markdown = await extract_markdown(page, include_tables=True, include_links=True)

        # Save to file
        with open('/tmp/article.md', 'w') as f:
            f.write(markdown)
        print('✅ Article saved to /tmp/article.md')

        # Extract with metadata
        data = await extract_with_metadata(page)
        print(f"Title: {data.get('title', 'N/A')}")
        print(f"Author: {data.get('author', 'N/A')}")
        print(f"Published: {data.get('date', 'N/A')}")

        await browser.close()

asyncio.run(main())
```

### Available Extraction Functions

**`extract_markdown(page, include_tables=True, include_links=True, include_images=False)`**
- Extracts content as Markdown
- Preserves headings, lists, code blocks, tables, and links
- Best for preserving document structure

**`extract_text(page, include_tables=True)`**
- Extracts content as plain text
- Removes all formatting
- Best for text analysis or search indexing

**`extract_with_metadata(page, output_format='json')`**
- Extracts content with metadata (title, author, date, description, etc.)
- Returns dictionary with structured data
- Best for archiving or content management

**`extract_content(page, output_format='markdown', ...)`**
- Low-level function with full control
- Supports formats: 'markdown', 'txt', 'json', 'xml', 'csv'
- Advanced options for comments, images, etc.

### Use Cases

**Documentation scraping:**
```python
# Extract API docs as markdown
await page.goto('https://docs.example.com/api')
markdown = await extract_markdown(page)
with open('api-docs.md', 'w') as f:
    f.write(markdown)
```

**Article archiving:**
```python
# Save blog post with metadata
data = await extract_with_metadata(page)
# Store in database or file system
```

**Content analysis:**
```python
# Extract clean text for NLP processing
text = await extract_text(page)
# Run sentiment analysis, keyword extraction, etc.
```

## Custom HTTP Headers

Configure custom headers for all HTTP requests via environment variables. Useful for:

- Identifying automated traffic to your backend
- Getting LLM-optimized responses (e.g., plain text errors instead of styled HTML)
- Adding authentication tokens globally

### Configuration

**Single header (common case):**

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=patchright-skill \
  cd $SKILL_DIR && python3 run.py /tmp/my-script.py
```

**Multiple headers (JSON format):**

```bash
PW_EXTRA_HEADERS='{"X-Automated-By":"patchright-skill","X-Debug":"true"}' \
  cd $SKILL_DIR && python3 run.py /tmp/my-script.py
```

### How It Works

Headers are automatically applied when using `helpers.create_context()`:

```python
context = await helpers.create_context(browser)
page = await context.new_page()
# All requests from this page include your custom headers
```

For scripts using raw Patchright API, use the injected `get_context_options_with_headers()`:

```python
options = get_context_options_with_headers({'viewport': {'width': 1920, 'height': 1080}})
context = await browser.new_context(**options)
```

## Anti-Detection Features

Patchright includes patches to bypass common bot detection:

- **Cloudflare** - Passes Cloudflare's browser integrity checks
- **Akamai** - Bypasses Akamai Bot Manager
- **DataDome** - Evades DataDome detection
- **Kasada** - Passes Kasada challenges
- **Fingerprint.com** - Avoids fingerprinting detection

**Best practices for maximum stealth:**
- Use `headless=False` (visible browser)
- Don't set custom user agents or headers unless necessary
- Use `channel="chrome"` to use system Chrome if available
- Avoid adding automation-revealing browser arguments

## Advanced Usage

For comprehensive Patchright/Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):

- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques
- CI/CD integration

## Tips

- **CRITICAL: Detect servers FIRST** - Always run `detect_dev_servers_sync()` before writing test code for localhost testing
- **Custom headers** - Use `PW_HEADER_NAME`/`PW_HEADER_VALUE` env vars to identify automated traffic to your backend
- **Use /tmp for test files** - Write to `/tmp/patchright-test-*.py`, never to skill directory or user's project
- **Parameterize URLs** - Put detected/provided URL in a `TARGET_URL` constant at the top of every script
- **DEFAULT: Visible browser** - Always use `headless=False` unless user explicitly asks for headless mode
- **Headless mode** - Only use `headless=True` when user specifically requests "headless" or "background" execution
- **Slow down:** Use `slow_mo=100` to make actions visible and easier to follow
- **Wait strategies:** Use `wait_for_url`, `wait_for_selector`, `wait_for_load_state` instead of fixed timeouts
- **Error handling:** Always use try-except for robust automation
- **Console output:** Use `print()` to track progress and show what's happening

## Troubleshooting

**Patchright not installed:**
```bash
uv pip install patchright
uv run patchright install chromium
```

**Module not found:**
Ensure running from skill directory via `run.py` wrapper

**Browser doesn't open:**
Check `headless=False` and ensure display available

**Element not found:**
Add wait: `await page.wait_for_selector('.element', timeout=10000)`

**Bot detection triggered:**
- Ensure using Patchright (not vanilla Playwright)
- Try `headless=False`
- Avoid custom user agents

## Example Usage

```
User: "Test if the marketing page looks good"

Claude: I'll test the marketing page across multiple viewports. Let me first detect running servers...
[Runs: detect_dev_servers_sync()]
[Output: Found server on port 3001]
I found your dev server running on http://localhost:3001

[Writes custom automation script to /tmp/patchright-test-marketing.py with URL parameterized]
[Runs: cd $SKILL_DIR && python3 run.py /tmp/patchright-test-marketing.py]
[Shows results with screenshots from /tmp/]
```

```
User: "Check if login redirects correctly"

Claude: I'll test the login flow. First, let me check for running servers...
[Runs: detect_dev_servers_sync()]
[Output: Found servers on ports 3000 and 3001]
I found 2 dev servers. Which one should I test?
- http://localhost:3000
- http://localhost:3001

User: "Use 3001"

[Writes login automation to /tmp/patchright-test-login.py]
[Runs: cd $SKILL_DIR && python3 run.py /tmp/patchright-test-login.py]
[Reports: ✅ Login successful, redirected to /dashboard]
```

## Notes

- Each automation is custom-written for your specific request
- Not limited to pre-built scripts - any browser task possible
- Auto-detects running dev servers to eliminate hardcoded URLs
- Test scripts written to `/tmp` for automatic cleanup (no clutter)
- Code executes reliably with proper module resolution via `run.py`
- Progressive disclosure - API_REFERENCE.md loaded only when advanced features needed
- **Uses Patchright** - Undetected Playwright fork that bypasses bot detection
- **Chromium only** - Patchright only supports Chromium-based browsers (not Firefox/WebKit)
