# Changelog

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
