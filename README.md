# Playwright Skill for Claude Code

**Write CI-ready E2E test suites with `@playwright/test`**

A [Claude Skill](https://docs.claude.com/en/docs/claude-code/skills) that enables Claude to write complete, persistent end-to-end test suites for your project — exploring the codebase first to understand the app, then generating `*.spec.ts` files, `playwright.config.ts`, and CI workflow configs ready to run in GitHub Actions or GitLab CI.

Packaged as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) for easy installation and distribution.

## Features

- **Project-aware** — Claude reads your `package.json`, existing test structure, and framework before writing a single line
- **Persistent test files** — Writes to your project's `e2e/` directory, not a temp folder, so tests are committed to source control
- **CI-first defaults** — Headless, no `slowMo`, proper `playwright.config.ts` with `forbidOnly`, retries, and artifact capture
- **`@playwright/test` patterns** — Proper `test()` / `expect()` / `describe()` blocks, role-based selectors, fixtures, Page Object Model
- **CI config generation** — GitHub Actions and GitLab CI templates with artifact upload on failure


## How It Works

1. Ask Claude to write E2E tests for your project
2. Claude explores your project: reads `package.json`, route files, auth components, and `.env.example` to understand the actual app
3. Claude installs `@playwright/test` if missing, generates `playwright.config.ts` if absent
4. Claude writes `*.spec.ts` files to your project's `e2e/` directory covering key user flows
5. Optionally generates a GitHub Actions / GitLab CI workflow with a build step and secrets guidance
6. Tests run via `npx playwright test` — locally against the dev server or in CI against a production build

## Installation

This repository is structured as a [Claude Code Plugin](https://docs.claude.com/en/docs/claude-code/plugins) with a nested skill directory.

```
playwright-skill/              # Plugin root (GitHub repo name)
├── .claude-plugin/           # Plugin metadata
└── skills/
    └── playwright-test/        # The skill Claude discovers (/playwright-test)
        └── SKILL.md
```

---

### Option 1: Plugin Installation (Recommended)

```bash
# Add this repository as a marketplace
/plugin marketplace add zizzfizzix/playwright-skill

# Install the plugin
/plugin install playwright-test@playwright-test
```

No further setup needed — the skill has no dependencies of its own.

---

### Option 2: Standalone Global Installation

```bash
git clone https://github.com/zizzfizzix/playwright-skill.git /tmp/pw-e2e-temp

mkdir -p ~/.claude/skills
cp -r /tmp/pw-e2e-temp/skills/playwright-test ~/.claude/skills/

rm -rf /tmp/pw-e2e-temp
```

---

### Option 3: Project-Specific Installation

```bash
git clone https://github.com/zizzfizzix/playwright-skill.git /tmp/pw-e2e-temp

mkdir -p .claude/skills
cp -r /tmp/pw-e2e-temp/skills/playwright-test .claude/skills/

rm -rf /tmp/pw-e2e-temp
```

The skill has no dependencies of its own. `@playwright/test` is installed into your **project** by Claude when writing tests.

---

### Verify Installation

Run `/help` in Claude Code to confirm the skill is loaded. You should see `playwright-test` listed.

## Quick Start

After installation, ask Claude to write tests for your project:

```
"Write E2E tests for this app"
"Add Playwright tests for the login and signup flows"
"Write a CI-ready E2E test suite covering the main user journeys"
"Generate a playwright.config.ts and tests for the checkout flow"
```

Claude will explore your project, write the test files, and tell you how to run them.

## Usage Examples

### Write a Full Test Suite

```
"Write E2E tests covering: homepage loads, user can log in, user can create a post"
```

Claude will:
- Read your `package.json` to find the framework and dev server command
- Check for existing `playwright.config.ts` and `e2e/` directory
- Generate `playwright.config.ts` with CI-appropriate settings
- Write `e2e/homepage.spec.ts`, `e2e/auth.spec.ts`, `e2e/posts.spec.ts`

### Add CI Workflow

```
"Also generate a GitHub Actions workflow for these tests"
```

Claude writes `.github/workflows/e2e.yml` with browser install, test execution, and artifact upload on failure.

### Test Specific Flows

```
"Write tests for the checkout flow — add to cart, enter payment, confirm order"
"Add E2E tests for the settings page and form validation"
"Write tests for the admin dashboard"
```

### Validate Claude's Tests

After Claude writes the tests, run them from your project:

```bash
cd your-project
npx playwright test                          # run all tests
npx playwright test e2e/auth.spec.ts         # run a specific file
npx playwright test --headed                 # watch the browser
npx playwright test --grep "login"           # filter by name
```

## Project Structure

```
playwright-skill/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata
│   └── marketplace.json     # Marketplace configuration
├── skills/
│   └── playwright-test/
│       ├── SKILL.md         # Skill instructions Claude reads
│       └── API_REFERENCE.md # Full @playwright/test API reference
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## What Gets Written to Your Project

When Claude uses this skill, it writes to your project (not the skill directory):

| File | Location | Purpose |
|------|----------|---------|
| `playwright.config.ts` | project root | CI-ready config with `forbidOnly`, retries, artifact capture |
| `e2e/*.spec.ts` | project `e2e/` dir | Test spec files using `@playwright/test` |
| `e2e/global-setup.ts` | project `e2e/` dir | Auth setup: logs in once, saves `storageState` |
| `.github/workflows/e2e.yml` | project | GitHub Actions CI workflow (optional) |
| `.gitignore` entries | project | Excludes `test-results/`, `playwright-report/`, `e2e/.auth/` |

Tests are committed to your project's source control and run via `npx playwright test`.

## Dependencies

The skill itself has no dependencies — it's two markdown files.

Your project will need:
- Node.js ≥ 18
- `@playwright/test` (Claude installs this when writing tests)
- Chromium (`npx playwright install chromium`, run once after `@playwright/test` is installed)

## Troubleshooting

**`@playwright/test` not found in my project?**
Ask Claude to install it: *"Install @playwright/test in this project"*, or run:
```bash
npm install --save-dev @playwright/test && npx playwright install chromium
```

**Tests failing due to wrong base URL?**
Set `BASE_URL` when running: `BASE_URL=http://localhost:4000 npx playwright test`
Or update the `BASE_URL` constant at the top of `playwright.config.ts`.

**Tests pass locally but fail in CI?**
Ensure the CI workflow has a `npm run build` step before `npx playwright test`, and that all required secrets (`TEST_EMAIL`, `TEST_PASSWORD`, etc.) are set in repository settings.

**Want to run additional browsers?**
```bash
npx playwright install firefox webkit
```

## Learn More

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [API_REFERENCE.md](skills/playwright-test/API_REFERENCE.md) — Full `@playwright/test` API reference

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, and submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT — see [LICENSE](LICENSE) for details.
