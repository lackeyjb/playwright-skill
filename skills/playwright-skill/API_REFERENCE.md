# Patchright Skill - Complete API Reference

This document contains the comprehensive Patchright/Playwright API reference and advanced patterns. For quick-start execution patterns, see [SKILL.md](SKILL.md).

**Note:** Patchright is a drop-in replacement for Playwright with anti-bot detection patches. All Playwright APIs work identically - just change imports from `playwright` to `patchright`.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Core Patterns](#core-patterns)
- [Anti-Detection Best Practices](#anti-detection-best-practices)
- [Selectors & Locators](#selectors--locators)
- [Common Actions](#common-actions)
- [Waiting Strategies](#waiting-strategies)
- [Assertions](#assertions)
- [Page Object Model](#page-object-model-pom)
- [Network & API Testing](#network--api-testing)
- [Authentication & Session Management](#authentication--session-management)
- [Visual Testing](#visual-testing)
- [Mobile Testing](#mobile-testing)
- [Debugging](#debugging)
- [Performance Testing](#performance-testing)
- [Data-Driven Testing](#data-driven-testing)
- [Accessibility Testing](#accessibility-testing)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Common Patterns & Solutions](#common-patterns--solutions)
- [Troubleshooting](#troubleshooting)

## Installation & Setup

### Prerequisites

Before using this skill, ensure Patchright is available:

```bash
# Check if Patchright is installed
python3 -c "import patchright; print('Patchright installed')" 2>/dev/null || echo "Patchright not installed"

# Install (if needed)
uv pip install patchright
uv run patchright install chromium
```

### Basic Configuration

```python
# pytest configuration in conftest.py
import pytest
import asyncio
from patchright.async_api import async_playwright


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def browser():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        yield browser
        await browser.close()


@pytest.fixture
async def page(browser):
    context = await browser.new_context(
        viewport={"width": 1280, "height": 720}
    )
    page = await context.new_page()
    yield page
    await context.close()
```

## Core Patterns

### Basic Browser Automation (Async)

```python
import asyncio
from patchright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(
            headless=False,  # Set to True for headless mode
            slow_mo=50       # Slow down operations by 50ms
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )

        page = await context.new_page()

        # Navigate
        await page.goto("https://example.com", wait_until="networkidle")

        # Your automation here

        await browser.close()


asyncio.run(main())
```

### Synchronous API

```python
from patchright.sync_api import sync_playwright


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        page.goto("https://example.com")
        print(page.title())

        browser.close()


main()
```

### Test Structure with pytest

```python
import pytest
from patchright.async_api import async_playwright


class TestFeature:
    @pytest.fixture(autouse=True)
    async def setup(self, page):
        await page.goto("/")

    async def test_should_do_something(self, page):
        # Arrange
        button = page.locator('button[data-testid="submit"]')

        # Act
        await button.click()

        # Assert
        assert "/success" in page.url
        await expect(page.locator(".message")).to_have_text("Success!")
```

## Anti-Detection Best Practices

Patchright includes patches to bypass bot detection. For maximum stealth:

```python
async def launch_stealth_browser(p):
    # Best practices for avoiding detection
    browser = await p.chromium.launch(
        headless=False,          # Visible browser is harder to detect
        channel="chrome",         # Use system Chrome if available
        # Don't add automation flags
    )

    # For persistent contexts (maximum stealth)
    context = await p.chromium.launch_persistent_context(
        user_data_dir="./user-data",
        channel="chrome",
        headless=False,
        viewport=None,  # Use default viewport
        # Avoid custom headers/user_agent for maximum stealth
    )

    return browser
```

**Key principles:**
- Use `headless=False` (visible browser)
- Use `channel="chrome"` to use system Chrome
- Avoid custom user agents unless necessary
- Avoid custom HTTP headers unless necessary
- Don't add automation-revealing browser arguments

## Selectors & Locators

### Best Practices for Selectors

```python
# PREFERRED: Data attributes (most stable)
await page.locator('[data-testid="submit-button"]').click()
await page.locator('[data-cy="user-input"]').fill("text")

# GOOD: Role-based selectors (accessible)
await page.get_by_role("button", name="Submit").click()
await page.get_by_role("textbox", name="Email").fill("user@example.com")
await page.get_by_role("heading", level=1).click()

# GOOD: Text content (for unique text)
await page.get_by_text("Sign in").click()
await page.get_by_text(re.compile(r"welcome back", re.I)).click()

# OK: Semantic HTML
await page.locator('button[type="submit"]').click()
await page.locator('input[name="email"]').fill("test@test.com")

# AVOID: Classes and IDs (can change frequently)
await page.locator(".btn-primary").click()  # Avoid
await page.locator("#submit").click()       # Avoid

# LAST RESORT: Complex CSS/XPath
await page.locator("div.container > form > button").click()  # Fragile
```

### Advanced Locator Patterns

```python
# Filter and chain locators
row = page.locator("tr").filter(has_text="John Doe")
await row.locator("button").click()

# Nth element
await page.locator("button").nth(2).click()

# First and last
await page.locator("button").first.click()
await page.locator("button").last.click()

# Combining conditions
count = await page.locator("button").and_(page.locator("[disabled]")).count()

# Parent/child navigation
cell = page.locator("td").filter(has_text="Active")
row = cell.locator("..")
await row.locator("button.edit").click()
```

## Common Actions

### Form Interactions

```python
# Text input
await page.get_by_label("Email").fill("user@example.com")
await page.get_by_placeholder("Enter your name").fill("John Doe")

# Clear and type (with delay)
await page.locator("#username").clear()
await page.locator("#username").type("newuser", delay=100)

# Checkbox
await page.get_by_label("I agree").check()
await page.get_by_label("Subscribe").uncheck()

# Radio button
await page.get_by_label("Option 2").check()

# Select dropdown
await page.select_option("select#country", "usa")
await page.select_option("select#country", label="United States")
await page.select_option("select#country", index=2)

# Multi-select
await page.select_option("select#colors", ["red", "blue", "green"])

# File upload
await page.set_input_files('input[type="file"]', "path/to/file.pdf")
await page.set_input_files('input[type="file"]', [
    "file1.pdf",
    "file2.pdf"
])
```

### Mouse Actions

```python
# Click variations
await page.click("button")                           # Left click
await page.click("button", button="right")           # Right click
await page.dblclick("button")                        # Double click
await page.click("button", position={"x": 10, "y": 10})  # Click at position

# Hover
await page.hover(".menu-item")

# Drag and drop
await page.drag_and_drop("#source", "#target")

# Manual drag
await page.locator("#source").hover()
await page.mouse.down()
await page.locator("#target").hover()
await page.mouse.up()
```

### Keyboard Actions

```python
# Type with delay
await page.keyboard.type("Hello World", delay=100)

# Key combinations
await page.keyboard.press("Control+A")
await page.keyboard.press("Control+C")
await page.keyboard.press("Control+V")

# Special keys
await page.keyboard.press("Enter")
await page.keyboard.press("Tab")
await page.keyboard.press("Escape")
await page.keyboard.press("ArrowDown")
```

## Waiting Strategies

### Smart Waiting

```python
# Wait for element states
await page.locator("button").wait_for(state="visible")
await page.locator(".spinner").wait_for(state="hidden")
await page.locator("button").wait_for(state="attached")
await page.locator("button").wait_for(state="detached")

# Wait for specific conditions
await page.wait_for_url("**/success")
await page.wait_for_url(lambda url: "/dashboard" in url)

# Wait for network
await page.wait_for_load_state("networkidle")
await page.wait_for_load_state("domcontentloaded")

# Wait for function
await page.wait_for_function("document.querySelector('.loaded')")
await page.wait_for_function(
    "text => document.body.innerText.includes(text)",
    "Content loaded"
)

# Wait for response
async with page.expect_response("**/api/users") as response_info:
    await page.click("button#load-users")
response = await response_info.value

# Wait for request
async with page.expect_request(lambda r: "/api/" in r.url and r.method == "POST") as request_info:
    await page.click("button#submit")
request = await request_info.value

# Custom timeout
await page.locator(".slow-element").wait_for(
    state="visible",
    timeout=10000  # 10 seconds
)
```

## Assertions

### Common Assertions with expect

```python
from playwright.async_api import expect

# Page assertions
await expect(page).to_have_title("My App")
await expect(page).to_have_url("https://example.com/dashboard")
await expect(page).to_have_url(re.compile(r".*dashboard"))

# Element visibility
await expect(page.locator(".message")).to_be_visible()
await expect(page.locator(".spinner")).to_be_hidden()
await expect(page.locator("button")).to_be_enabled()
await expect(page.locator("input")).to_be_disabled()

# Text content
await expect(page.locator("h1")).to_have_text("Welcome")
await expect(page.locator(".message")).to_contain_text("success")
await expect(page.locator(".items")).to_have_text(["Item 1", "Item 2"])

# Input values
await expect(page.locator("input")).to_have_value("test@example.com")
await expect(page.locator("input")).to_be_empty()

# Attributes
await expect(page.locator("button")).to_have_attribute("type", "submit")
await expect(page.locator("img")).to_have_attribute("src", re.compile(r".*\.png"))

# CSS properties
await expect(page.locator(".error")).to_have_css("color", "rgb(255, 0, 0)")

# Count
await expect(page.locator(".item")).to_have_count(5)

# Checkbox/Radio state
await expect(page.locator('input[type="checkbox"]')).to_be_checked()
```

## Page Object Model (POM)

### Basic Page Object

```python
# pages/login_page.py
class LoginPage:
    def __init__(self, page):
        self.page = page
        self.username_input = page.locator('input[name="username"]')
        self.password_input = page.locator('input[name="password"]')
        self.submit_button = page.locator('button[type="submit"]')
        self.error_message = page.locator(".error-message")

    async def navigate(self):
        await self.page.goto("/login")

    async def login(self, username, password):
        await self.username_input.fill(username)
        await self.password_input.fill(password)
        await self.submit_button.click()

    async def get_error_message(self):
        return await self.error_message.text_content()


# Usage in test
async def test_login_with_valid_credentials(page):
    login_page = LoginPage(page)
    await login_page.navigate()
    await login_page.login("user@example.com", "password123")
    assert "/dashboard" in page.url
```

## Network & API Testing

### Intercepting Requests

```python
# Mock API responses
async def mock_users(route):
    await route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([
            {"id": 1, "name": "John"},
            {"id": 2, "name": "Jane"}
        ])
    )

await page.route("**/api/users", mock_users)


# Modify requests
async def add_custom_header(route):
    headers = {**route.request.headers, "X-Custom-Header": "value"}
    await route.continue_(headers=headers)

await page.route("**/api/**", add_custom_header)


# Block resources
await page.route("**/*.{png,jpg,jpeg,gif}", lambda route: route.abort())
```

### Custom Headers via Environment Variables

The skill supports automatic header injection via environment variables:

```bash
# Single header (simple)
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=patchright-skill

# Multiple headers (JSON)
PW_EXTRA_HEADERS='{"X-Automated-By":"patchright-skill","X-Request-ID":"123"}'
```

These headers are automatically applied to all requests when using:
- `helpers.create_context(browser)` - headers merged automatically
- `get_context_options_with_headers(options)` - utility injected by run.py wrapper

**Use case:** Identify automated traffic so your backend can return LLM-optimized responses.

## Visual Testing

### Screenshots

```python
# Full page screenshot
await page.screenshot(path="screenshot.png", full_page=True)

# Element screenshot
await page.locator(".chart").screenshot(path="chart.png")

# Clip specific area
await page.screenshot(
    path="header.png",
    clip={"x": 0, "y": 0, "width": 1280, "height": 100}
)
```

## Mobile Testing

```python
# Device emulation
from patchright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        iphone = p.devices["iPhone 12"]

        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            **iphone,
            locale="en-US",
            permissions=["geolocation"],
            geolocation={"latitude": 37.7749, "longitude": -122.4194}
        )

        page = await context.new_page()
        await page.goto("https://example.com")
        # Mobile testing here
        await browser.close()

asyncio.run(main())
```

## Debugging

### Debug Mode

```bash
# Run with Playwright inspector
PWDEBUG=1 python3 your_script.py

# Headed mode with slow motion
# (configure in your script)
```

### In-Code Debugging

```python
# Pause execution (opens inspector)
await page.pause()

# Console logs
page.on("console", lambda msg: print(f"Browser log: {msg.text}"))
page.on("pageerror", lambda error: print(f"Page error: {error}"))

# Network monitoring
page.on("request", lambda req: print(f">> {req.method} {req.url}"))
page.on("response", lambda res: print(f"<< {res.status} {res.url}"))
```

## Performance Testing

```python
import time

# Measure page load time
start_time = time.time()
await page.goto("https://example.com")
load_time = time.time() - start_time
print(f"Page loaded in {load_time:.2f}s")

# Get performance metrics
metrics = await page.evaluate("""() => {
    const timing = performance.timing;
    return {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        connection: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart
    };
}""")
print(metrics)
```

## Data-Driven Testing

```python
import pytest

# Parameterized tests
test_data = [
    ("user1", "pass1", "Welcome user1"),
    ("user2", "pass2", "Welcome user2"),
]


@pytest.mark.parametrize("username,password,expected", test_data)
async def test_login(page, username, password, expected):
    await page.goto("/login")
    await page.fill("#username", username)
    await page.fill("#password", password)
    await page.click('button[type="submit"]')
    await expect(page.locator(".message")).to_have_text(expected)
```

## Accessibility Testing

```python
# Using axe-core
async def check_accessibility(page):
    await page.goto("/")

    # Inject axe-core
    await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js")

    # Run accessibility check
    results = await page.evaluate("axe.run()")

    violations = results.get("violations", [])
    if violations:
        for v in violations:
            print(f"Violation: {v['id']} - {v['description']}")
    else:
        print("No accessibility violations found")

    return violations
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Patchright Tests
on:
  push:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.13"
      - name: Install dependencies
        run: |
          pip install uv
          uv pip install patchright pytest pytest-asyncio
          uv run patchright install chromium
      - name: Run tests
        run: pytest tests/ -v
```

## Best Practices

1. **Test Organization** - Use descriptive test names, group related tests
2. **Selector Strategy** - Prefer data-testid attributes, use role-based selectors
3. **Waiting** - Use Patchright's auto-waiting, avoid hard-coded delays
4. **Error Handling** - Add proper error messages, take screenshots on failure
5. **Anti-Detection** - Use visible browser, avoid custom user agents

## Common Patterns & Solutions

### Handling Popups

```python
async with page.expect_popup() as popup_info:
    await page.click("button.open-popup")
popup = await popup_info.value
await popup.wait_for_load_state()
```

### File Downloads

```python
async with page.expect_download() as download_info:
    await page.click("button.download")
download = await download_info.value
await download.save_as(f"./downloads/{download.suggested_filename}")
```

### iFrames

```python
frame = page.frame_locator("#my-iframe")
await frame.locator("button").click()
```

### Infinite Scroll

```python
async def scroll_to_bottom(page):
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await asyncio.sleep(0.5)
```

### Handling Alerts

```python
page.on("dialog", lambda dialog: dialog.accept())
await page.click("button.trigger-alert")
```

## Troubleshooting

### Common Issues

1. **Element not found** - Check if element is in iframe, verify visibility
2. **Timeout errors** - Increase timeout, check network conditions
3. **Flaky tests** - Use proper waiting strategies, mock external dependencies
4. **Authentication issues** - Verify auth state is properly saved
5. **Bot detection triggered** - Use visible browser, avoid custom user agents, ensure using Patchright

### Quick Reference Commands

```bash
# Install Patchright
uv pip install patchright

# Install browsers
uv run patchright install chromium
uv run patchright install chrome  # System Chrome (recommended for stealth)

# Run with debug
PWDEBUG=1 python3 your_script.py

# Generate code (uses playwright codegen)
python3 -m playwright codegen https://example.com
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/python/docs/intro) (Patchright is API-compatible)
- [Patchright GitHub](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python)
- [Playwright API Reference](https://playwright.dev/python/docs/api/class-playwright)
