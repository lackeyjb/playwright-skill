# Contributing to Playwright Skill

Thank you for considering contributing to the Playwright Skill plugin for Claude Code!

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, Playwright version)
- Example code that demonstrates the issue

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:
- Check existing issues first to avoid duplicates
- Clearly describe the enhancement and its benefits
- Provide examples of how it would be used

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/lackeyjb/playwright-skill.git
   cd playwright-skill
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run setup
   # Test your changes with Claude Code
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Provide a clear description of your changes

## Development Guidelines

### Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Keep functions focused on a single responsibility
- Follow existing patterns in the codebase

### SKILL.md Guidelines

- Keep examples concise (8-15 lines)
- Always show `headless: false` by default
- Include error handling in examples
- Add console.log statements for visibility
- Reference README.md for advanced topics

### Commit Messages

Use conventional commits format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add mobile device emulation helper
fix: resolve module resolution issue in run.js
docs: update installation instructions
```

### File Structure

```
playwright-skill/
├── SKILL.md           # Keep concise (~300 lines)
├── README.md          # Full API reference
├── PLUGIN_README.md   # Plugin distribution docs
├── run.js             # Universal executor
├── package.json       # Dependencies
├── plugin.json        # Plugin metadata
└── lib/
    └── helpers.js     # Utility functions
```

### Adding New Helpers

When adding functions to `lib/helpers.js`:
1. Add clear JSDoc comments
2. Include error handling
3. Export the function
4. Update SKILL.md to mention it
5. Add example usage

### Testing

Before submitting:
1. Test with a fresh installation
2. Verify examples in SKILL.md work
3. Check that `run.js` handles edge cases
4. Ensure browser opens in visible mode by default

## Questions?

Feel free to open an issue for discussion before starting work on major changes.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
