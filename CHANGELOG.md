# Changelog

## [Unreleased]

### Added

- Added `@playwright/test` as a dependency so scripts can use `expect` assertions
  directly. Inline `-e` snippets now provide `expect` in scope alongside
  `chromium`, `firefox`, `webkit`, `devices`, and `helpers`.
- Added `run.js --detect-servers [port ...]` so dev-server detection no longer
  requires embedding the skill path in a `node -e` string, which corrupted
  Windows backslash paths.
- Added `PW_LOCALE` and `PW_TIMEZONE` configuration to pin the browser context
  locale and timezone.
- Added `allScopes`, `clickTextAnywhere`, `fillLabeledField`, `sleep`, and
  `waitTextAnywhere` helpers. `allScopes` enumerates every page and iframe
  of a page or context; `clickTextAnywhere` clicks the first visible match
  for text across all of them (regex-escaped text, `attempts`/`gapMs` retry
  while a page renders, and `false` when nothing matched); `fillLabeledField`
  fills the text control associated with a label via native label association
  or same-cell/document-order proximity; `sleep` is a promise delay for
  pacing and backoff; `waitTextAnywhere` polls every scope until text
  becomes visible, for verifying outcomes after actions.

### Changed

- SKILL.md setup commands now use `npm --prefix "$SKILL_DIR" run setup` instead
  of `cd "$SKILL_DIR" && npm run setup`, so the command starts with `npm` and
  matches the `Bash(npm:*)` allowed-tools prefix without a permission prompt.
- SKILL.md workflow notes that scripts must use CommonJS (`require`) because
  the executor resolves modules through NODE_PATH, which ES module `import`
  ignores, and that long visible-browser flows need a raised shell timeout
  (up to 600000 ms) to avoid being killed mid-run.
- SKILL.md workflow now closes the verification loop: screenshot artifacts
  must be read back (the Read tool renders PNGs) and visually confirmed
  before success is reported.

### Breaking changes

- `createContext()` no longer hardcodes `locale: 'en-US'` and
  `timezoneId: 'America/New_York'`; it follows the system locale and timezone
  so sites render as they would for a local user. Set `PW_LOCALE` or
  `PW_TIMEZONE` to pin them explicitly.

## [5.0.0] - 2026-08-11

### Changed

- Updated the skill to the current Agent Skills frontmatter specification.
- Updated the runtime requirement to Node.js 20+ and Playwright 1.62+.
- Replaced the temporary-file executor with a child-process executor that preserves exit codes.
- Added explicit inline execution with `node run.js -e` and `PW_SCRIPT_DIR` support.
- Reduced helpers to focused browser setup, server detection, headers, cookie banners, and screenshots.
- Modernized examples around accessible locators and web-first waiting.
- Added CI, fixtures, unit tests, contribution templates, and Dependabot configuration.
- Updated GitHub Actions checkout and setup-node to v7.

### Breaking changes

- Helpers that duplicated Playwright actions, waits, extraction, authentication, and retries were removed. Use Playwright locators and assertions directly.
- Stdin execution through `run.js` was removed; use a script file or `-e`.
- `createContext()` no longer accepts a `mobile` option. Use Playwright device descriptors such as `devices['iPhone 15']` instead.
- `launchBrowser()` no longer passes `--no-sandbox` unconditionally. It is only added for Chromium when running as root; pass `args: ['--no-sandbox']` explicitly in other cases.
- An empty `PW_HEADLESS=` is now treated as unset and falls back to visible mode rather than headless.
- `run.js` executes scripts in the caller's working directory instead of the skill directory, so relative paths resolve against the user's project.
