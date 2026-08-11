# Changelog

## [5.0.0] - Unreleased

### Changed

- Updated the skill to the current Agent Skills frontmatter specification.
- Updated the runtime requirement to Node.js 20+ and Playwright 1.62+.
- Replaced the temporary-file executor with a child-process executor that preserves exit codes.
- Added explicit inline execution with `node run.js -e` and `PW_SCRIPT_DIR` support.
- Reduced helpers to focused browser setup, server detection, headers, cookie banners, and screenshots.
- Modernized examples around accessible locators and web-first waiting.
- Added CI, fixtures, unit tests, contribution templates, and Dependabot configuration.

### Breaking changes

- Helpers that duplicated Playwright actions, waits, extraction, authentication, and retries were removed. Use Playwright locators and assertions directly.
- Stdin execution through `run.js` was removed; use a script file or `-e`.
