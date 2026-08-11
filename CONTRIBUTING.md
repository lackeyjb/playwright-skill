# Contributing

Playwright Skill is an Agent Skill packaged as a Claude Code plugin. Focused
bug fixes, documentation improvements, and portable examples are welcome.

## Development

Requirements: Node.js 20+ and npm.

```bash
cd skills/playwright-skill
npm install
npx playwright install chromium
npm test
cd ../..
node tests/smoke.js
npx skills-ref@0.1.5 validate skills/playwright-skill
```

Keep browser artifacts out of the repository. Use the existing fixtures for
smoke coverage and add a focused `node:test` test for non-trivial helper logic.

## Pull requests

- Open or reference an issue when the change is contributor-facing.
- Keep `SKILL.md` concise; put detailed material in `API_REFERENCE.md`.
- Use accessible locators and web-first assertions in examples.
- Update documentation when behavior or environment variables change.
- Include the commands used to verify the change.
- Use a conventional commit title such as `feat:`, `fix:`, `docs:`, or `test:`.

The v5.0.0 work is tracked in the [roadmap issue](https://github.com/lackeyjb/playwright-skill/issues/39).

## Reporting problems

Use the issue templates and include the OS, Node.js version, Playwright
version, agent client, reproduction, and expected behavior. Questions and tool
comparisons belong in GitHub Discussions when enabled.

## License

By contributing, you agree that your contribution is licensed under MIT.
