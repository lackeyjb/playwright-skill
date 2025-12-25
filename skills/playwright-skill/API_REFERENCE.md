# Playwright Skill - Complete API Reference

This document contains the comprehensive Playwright API reference and advanced patterns. For quick-start execution patterns, see [SKILL.md](SKILL.md).

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Core Patterns](#core-patterns)
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
- [Parallel Execution](#parallel-execution)
- [Data-Driven Testing](#data-driven-testing)
- [Accessibility Testing](#accessibility-testing)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Common Patterns & Solutions](#common-patterns--solutions)
- [Troubleshooting](#troubleshooting)

## Installation & Setup

### Prerequisites

Before using this skill, ensure Playwright is available:

```bash
# Check if Playwright is installed
python -c "import playwright; print('Playwright installed')" 2>/dev/null || echo "Playwright not installed"

# Run setup (auto-installs playwright==1.54.0 via PEP 723)
cd ~/.claude/skills/playwright-skill
uv run run.py --help
```

### Basic Configuration

Create `playwright.config.py` (if using Playwright test framework):

```python
from playwright.sync_api import Page, BrowserContext
from typing import Generator

def pytest_generate_tests(metafunc):
    # Custom test generation
    pass

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {
        **browser_context_args,
        "viewport": {"width": 1280, "height": 720},
        "locale": "en-US",
        "timezone_id": "America/New_York",
    }

@pytest.fixture
def page(page: Page) -> Generator[Page, None, None]:
    page.goto("http://localhost:3000")
    yield page
```

## Core Patterns

### Basic Browser Automation

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # Launch browser
    browser = p.chromium.launch(
        headless=False,  # Set to True for headless mode
        slow_mo=50       # Slow down operations by 50ms
    )

    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    page = context.new_page()

    # Navigate
    page.goto("https://example.com", wait_until="networkidle")

    # Your automation here

    browser.close()
```

### Test Structure

```python
from playwright.sync_api import Page, expect

def test_feature_name(page: Page):
    page.goto("/")

    # Arrange
    button = page.locator('button[data-testid="submit-button"]')

    # Act
    button.click()

    # Assert
    expect(page).to_have_url("/success")
    expect(page.locator(".message")).to_have_text("Success!")
```

## Selectors & Locators

### Best Practices for Selectors

```python
# PREFERRED: Data attributes (most stable)
page.locator('[data-testid="submit-button"]').click()
page.locator('[data-cy="user-input"]').fill('text')

# GOOD: Role-based selectors (accessible)
page.get_by_role("button", name="Submit").click()
page.get_by_role("textbox", name="Email").fill('user@example.com')
page.get_by_role("heading", level=1).click()

# GOOD: Text content (for unique text)
page.get_by_text("Sign in").click()
page.get_by_text(/welcome back/i).click()

# OK: Semantic HTML
page.locator('button[type="submit"]').click()
page.locator('input[name="email"]').fill('test@test.com')

# AVOID: Classes and IDs (can change frequently)
page.locator('.btn-primary').click()  # Avoid
page.locator('#submit').click()       # Avoid

# LAST RESORT: Complex CSS/XPath
page.locator('div.container > form > button').click()  # Fragile
```

### Advanced Locator Patterns

```python
# Filter and chain locators
row = page.locator('tr').filter(has_text="John Doe")
row.locator('button').click()

# Nth element
page.locator('button').nth(2).click()

# Combining conditions
page.locator('button').and_(page.locator('[disabled]')).count()

# Parent/child navigation
cell = page.locator('td').filter(has_text="Active")
row = cell.locator('..')
row.locator('button.edit').click()
```

## Common Actions

### Form Interactions

```python
# Text input
page.get_by_label("Email").fill('user@example.com')
page.get_by_placeholder("Enter your name").fill('John Doe')

# Clear and type
page.locator('#username').clear()
page.locator('#username').type('newuser', delay=100)

# Checkbox
page.get_by_label("I agree").check()
page.get_by_label("Subscribe").uncheck()

# Radio button
page.get_by_label("Option 2").check()

# Select dropdown
page.select_option('select#country', 'usa')
page.select_option('select#country', label="United States")
page.select_option('select#country', index=2)

# Multi-select
page.select_option('select#colors', ['red', 'blue', 'green'])

# File upload
page.set_input_files('input[type="file"]', 'path/to/file.pdf')
page.set_input_files('input[type="file"]', ['file1.pdf', 'file2.pdf'])
```

### Mouse Actions

```python
# Click variations
page.click('button')                          # Left click
page.click('button', button="right")          # Right click
page.dblclick('button')                       # Double click
page.click('button', position={"x": 10, "y": 10})  # Click at position

# Hover
page.hover('.menu-item')

# Drag and drop
page.drag_and_drop('#source', '#target')

# Manual drag
page.locator('#source').hover()
page.mouse.down()
page.locator('#target').hover()
page.mouse.up()
```

### Keyboard Actions

```python
# Type with delay
page.keyboard.type('Hello World', delay=100)

# Key combinations
page.keyboard.press('Control+A')
page.keyboard.press('Control+C')
page.keyboard.press('Control+V')

# Special keys
page.keyboard.press('Enter')
page.keyboard.press('Tab')
page.keyboard.press('Escape')
page.keyboard.press('ArrowDown')
```

## Waiting Strategies

### Smart Waiting

```python
# Wait for element states
page.locator('button').wait_for(state='visible')
page.locator('.spinner').wait_for(state='hidden')
page.locator('button').wait_for(state='attached')
page.locator('button').wait_for(state='detached')

# Wait for specific conditions
page.wait_for_url('**/success')
page.wait_for_url(lambda url: url.pathname == '/dashboard')

# Wait for network
page.wait_for_load_state('networkidle')
page.wait_for_load_state('domcontentloaded')

# Wait for function
page.wait_for_function('() => document.querySelector(".loaded")')
page.wait_for_function(
    'text => document.body.innerText.includes(text)',
    arg='Content loaded'
)

# Wait for response
with page.expect_response('**/api/users') as response_info:
    page.click('button#load-users')
response = response_info.value

# Wait for request
with page.expect_request(lambda request: '/api/' in request.url and request.method == 'POST'):
    page.click('button#submit')

# Custom timeout
page.locator('.slow-element').wait_for(
    state='visible',
    timeout=10000  # 10 seconds
)
```

## Assertions

### Common Assertions

```python
from playwright.sync_api import expect

# Page assertions
expect(page).to_have_title('My App')
expect(page).to_have_url('https://example.com/dashboard')
expect(page).to_have_url(/.*dashboard/)

# Element visibility
expect(page.locator('.message')).to_be_visible()
expect(page.locator('.spinner')).to_be_hidden()
expect(page.locator('button')).to_be_enabled()
expect(page.locator('input')).to_be_disabled()

# Text content
expect(page.locator('h1')).to_have_text('Welcome')
expect(page.locator('.message')).to_contain_text('success')
expect(page.locator('.items')).to_have_text(['Item 1', 'Item 2'])

# Input values
expect(page.locator('input')).to_have_value('test@example.com')
expect(page.locator('input')).to_be_empty()

# Attributes
expect(page.locator('button')).to_have_attribute('type', 'submit')
expect(page.locator('img')).to_have_attribute('src', /.*\.png/)

# CSS properties
expect(page.locator('.error')).to_have_css('color', 'rgb(255, 0, 0)')

# Count
expect(page.locator('.item')).to_have_count(5)

# Checkbox/Radio state
expect(page.locator('input[type="checkbox"]')).to_be_checked()
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
        self.error_message = page.locator('.error-message')

    def navigate(self):
        self.page.goto('/login')

    def login(self, username, password):
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.submit_button.click()

    def get_error_message(self):
        return self.error_message.text_content()

# Usage in test
def test_login_with_valid_credentials(page: Page):
    login_page = LoginPage(page)
    login_page.navigate()
    login_page.login('user@example.com', 'password123')
    expect(page).to_have_url('/dashboard')
```

## Network & API Testing

### Intercepting Requests

```python
# Mock API responses
def route_handler(route):
    route.fulfill(
        status=200,
        content_type='application/json',
        body='[{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]'
    )

page.route('**/api/users', route_handler)

# Modify requests
def modify_headers(route):
    headers = route.request.headers
    headers['X-Custom-Header'] = 'value'
    route.continue_(headers=headers)

page.route('**/api/**', modify_headers)

# Block resources
page.route('**/*.{png,jpg,jpeg,gif}', lambda route: route.abort())
```

### Custom Headers via Environment Variables

The skill supports automatic header injection via environment variables:

```bash
# Single header (simple)
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill

# Multiple headers (JSON)
PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Request-ID":"123"}'
```

These headers are automatically applied to all requests when using:
- `create_context(browser)` - headers merged automatically
- `get_context_options_with_headers(options)` - utility from helpers.py

**Precedence (highest to lowest):**
1. Headers passed directly in `options.extra_http_headers`
2. Environment variable headers
3. Playwright defaults

**Use case:** Identify automated traffic so your backend can return LLM-optimized responses (e.g., plain text errors instead of styled HTML).

## Visual Testing

### Screenshots

```python
# Full page screenshot
page.screenshot(path='screenshot.png', full_page=True)

# Element screenshot
page.locator('.chart').screenshot(path='chart.png')

# Visual comparison
expect(page).to_have_screenshot('homepage.png')
```

## Mobile Testing

```python
# Device emulation
from playwright.sync_api import devices

iphone = devices['iPhone 12']

context = browser.new_context(
    **iphone,
    locale='en-US',
    permissions=['geolocation'],
    geolocation={'latitude': 37.7749, 'longitude': -122.4194}
)
```

## Debugging

### Debug Mode

```bash
# Run with inspector
playwright codegen https://example.com

# Headed mode (when running scripts)
browser = p.chromium.launch(headless=False, slow_mo=1000)
```

### In-Code Debugging

```python
# Pause execution
page.pause()

# Console logs
page.on('console', lambda msg: print(f'Browser log: {msg.text}'))
page.on('pageerror', lambda error: print(f'Page error: {error}'))
```

## Performance Testing

```python
# Measure page load time
import time
start_time = time.time()
page.goto('https://example.com')
load_time = time.time() - start_time
print(f'Page loaded in {load_time * 1000:.0f}ms')
```

## Parallel Execution

```python
# Run tests in parallel
# Note: Parallel execution requires test framework like pytest
# This is a conceptual example
def test_parallel():
    pass  # Configure parallel execution in pytest
```

## Data-Driven Testing

```python
# Parameterized tests
test_data = [
    {'username': 'user1', 'password': 'pass1', 'expected': 'Welcome user1'},
    {'username': 'user2', 'password': 'pass2', 'expected': 'Welcome user2'},
]

for data in test_data:
    def test_login(data):
        page.goto('/login')
        page.fill('#username', data['username'])
        page.fill('#password', data['password'])
        page.click('button[type="submit"]')
        expect(page.locator('.message')).to_have_text(data['expected'])
```

## Accessibility Testing

```python
# Note: Requires additional packages
# pip install axe-playwright-python
from axe_playwright_python.sync_playwright import Axe

def test_accessibility(page: Page):
    page.goto('/')
    axe = Axe(page)
    results = axe.run()
    print(results)
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          pip install playwright==1.54.0
      - name: Run tests
        run: python -m playwright test
```

## Best Practices

1. **Test Organization** - Use descriptive test names, group related tests
2. **Selector Strategy** - Prefer data-testid attributes, use role-based selectors
3. **Waiting** - Use Playwright's auto-waiting, avoid hard-coded delays
4. **Error Handling** - Add proper error messages, take screenshots on failure
5. **Performance** - Run tests in parallel, reuse authentication state

## Common Patterns & Solutions

### Handling Popups

```python
with page.expect_popup() as popup_info:
    page.click('button.open-popup')
popup = popup_info.value
popup.wait_for_load_state()
```

### File Downloads

```python
with page.expect_download() as download_info:
    page.click('button.download')
download = download_info.value
download.save_as(f'./downloads/{download.suggested_filename}')
```

### iFrames

```python
frame = page.frame_locator('#my-iframe')
frame.locator('button').click()
```

### Infinite Scroll

```python
def scroll_to_bottom(page):
    page.evaluate('() => window.scrollTo(0, document.body.scrollHeight)')
    page.wait_for_timeout(500)
```

## Troubleshooting

### Common Issues

1. **Element not found** - Check if element is in iframe, verify visibility
2. **Timeout errors** - Increase timeout, check network conditions
3. **Flaky tests** - Use proper waiting strategies, mock external dependencies
4. **Authentication issues** - Verify auth state is properly saved

## Quick Reference Commands

```bash
# Run tests
python -m playwright test

# Run in headed mode
python -m playwright test --headed

# Debug tests
python -m playwright test --debug

# Generate code
playwright codegen https://example.com

# Show report
python -m playwright show-report
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
