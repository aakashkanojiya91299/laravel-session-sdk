# Contributing to Laravel Session SDK

Thank you for your interest in contributing to Laravel Session SDK! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Security Guidelines](#security-guidelines)
- [Pull Request Process](#pull-request-process)
- [Commit Messages](#commit-messages)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow security best practices

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/laravel-session-sdk.git
   cd laravel-session-sdk
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/aakashkanojiya91299/laravel-session-sdk.git
   ```

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- TypeScript knowledge
- MySQL or PostgreSQL (for testing database sessions)
- Redis (optional, for testing Redis sessions)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests (if available)
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
laravel-session-sdk/
├── src/                    # Source TypeScript files
│   ├── decoders/          # Session decoding logic
│   ├── stores/            # Database/Redis stores
│   ├── middleware/        # Framework middleware
│   ├── utils/             # Utility functions
│   ├── validators/         # Session validation
│   └── types/              # TypeScript type definitions
├── dist/                   # Compiled JavaScript (generated)
├── test/                   # Test files
├── examples/               # Usage examples
└── docs/                   # Documentation files
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure.

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `security/` - Security fixes

### 2. Make Your Changes

- Write clean, readable code
- Follow TypeScript best practices
- Add comments for complex logic
- Update documentation if needed
- Add tests for new features

### 3. Test Your Changes

```bash
# Build to check for TypeScript errors
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Run tests (if available)
npm test
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

### Example

```typescript
/**
 * Validates a Laravel session
 * @param sessionId - The Laravel session cookie value
 * @returns Promise resolving to validation result
 */
async validateSession(sessionId: string): Promise<SessionValidationResult> {
  // Implementation
}
```

### Formatting

- Use Prettier (configured in `.prettierrc`)
- Run `npm run format` before committing
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in arrays/objects

### Linting

- Follow ESLint rules (configured in `.eslintrc.json`)
- Fix all linting errors before submitting PR
- Run `npm run lint` to check

## Testing

### Writing Tests

- Write tests for new features
- Test edge cases and error scenarios
- Mock external dependencies (database, Redis)
- Use descriptive test names

### Test Structure

```typescript
describe('FeatureName', () => {
  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Running Tests

```bash
npm test
```

## Security Guidelines

### Critical Security Rules

1. **Never log sensitive data** in production code
   - Use `SecurityUtils` for sanitization
   - Default to `logLevel: 'secure'`
   - Only use `logLevel: 'verbose'` in development

2. **Sanitize all user input**
   - Session IDs should be sanitized in logs
   - Passwords/tokens should never be logged
   - Use `sanitizeSessionId()`, `sanitizeError()`, etc.

3. **Follow CWE guidelines**
   - CWE-312: No cleartext storage of sensitive data
   - CWE-359: No privacy violations in logs
   - CWE-532: No sensitive info in log files

4. **Validate all inputs**
   - Check session IDs before processing
   - Validate database configurations
   - Handle errors gracefully

### Security Checklist

- [ ] No passwords/tokens in logs
- [ ] Session IDs are sanitized
- [ ] Error messages don't expose sensitive data
- [ ] Input validation is in place
- [ ] Security utilities are used correctly

## Pull Request Process

### Before Submitting

1. **Update CHANGELOG.md**
   - Add entry under "Unreleased" or new version
   - Describe changes clearly
   - Link to related issues

2. **Update Documentation**
   - Update README.md if needed
   - Add examples if introducing new features
   - Update API documentation

3. **Ensure Tests Pass**
   ```bash
   npm run build
   npm run lint
   npm test
   ```

4. **Sync with Upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested the changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. **Automated Checks**
   - TypeScript compilation
   - Linting
   - Tests (if available)

2. **Code Review**
   - Maintainers will review your PR
   - Address feedback promptly
   - Make requested changes

3. **Approval**
   - At least one maintainer approval required
   - All checks must pass
   - Conflicts must be resolved

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `security`: Security fixes

### Examples

```
feat(decoder): Add support for nested permission keys

Add dot notation support for extracting nested session keys
like 'user.permissions' or 'auth.permissions'.

Closes #123
```

```
fix(security): Sanitize session IDs in debug logs

Prevent CWE-532 vulnerability by masking session IDs in logs.
Only shows first 8 characters in secure mode.

Fixes #456
```

```
docs(readme): Update installation instructions

Clarify driver-based dependency requirements.
```

## Reporting Issues

### Bug Reports

Use the GitHub issue template and include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Step-by-step reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Node.js version, OS, package version
- **Logs**: Relevant error messages/logs (sanitized)
- **Screenshots**: If applicable

### Feature Requests

Include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Additional Context**: Any other relevant information

### Security Issues

**⚠️ Do NOT create public issues for security vulnerabilities!**

Instead, email: [aakash.wowrooms69@gmail.com](mailto:aakash.wowrooms69@gmail.com)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Development Workflow

### Daily Workflow

```bash
# 1. Fetch latest changes
git fetch upstream

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes
# ... edit files ...

# 4. Build and test
npm run build
npm run lint
npm test

# 5. Commit changes
git add .
git commit -m "feat: add new feature"

# 6. Push to your fork
git push origin feature/my-feature

# 7. Create PR on GitHub
```

### Keeping Branch Updated

```bash
# Rebase on latest main
git fetch upstream
git rebase upstream/main

# Force push (if already pushed)
git push --force-with-lease origin feature/my-feature
```

## Questions?

- Check existing [documentation](./README.md)
- Review [examples](./examples/)
- Open a [discussion](https://github.com/aakashkanojiya91299/laravel-session-sdk/discussions)
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Laravel Session SDK! 🎉

