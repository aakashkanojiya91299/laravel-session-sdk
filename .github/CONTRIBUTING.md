# Contributing to Laravel Session SDK

First off, thank you for considering contributing to Laravel Session SDK! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible using our bug report template.

**Good Bug Reports** include:

- A clear, descriptive title
- Exact steps to reproduce the issue
- Expected behavior vs. actual behavior
- Code samples
- Environment details (Node.js version, database, OS, etc.)
- Error messages and stack traces

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear, descriptive title
- Provide a detailed description of the proposed feature
- Explain why this enhancement would be useful
- Include code examples if applicable

### Security Vulnerabilities

**DO NOT** report security vulnerabilities through public GitHub issues. Please email security issues to [aakash.wowrooms69@gmail.com](mailto:aakash.wowrooms69@gmail.com).

See our [Security Policy](../SECURITY.md) for more details.

### Pull Requests

1. **Fork the Repository**

   ```bash
   git clone https://github.com/aakashkanojiya91299/laravel-session-sdk.git
   cd laravel-session-sdk
   npm install
   ```

2. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**

   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**

   ```bash
   npm run build
   npm test
   npm run lint
   ```

5. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with session validation"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation changes
   - `style:` code style changes (formatting, etc.)
   - `refactor:` code refactoring
   - `test:` adding or updating tests
   - `chore:` maintenance tasks

6. **Push and Create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

   Then create a Pull Request on GitHub using our PR template.

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git
- MySQL or PostgreSQL (for testing)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/laravel-session-sdk.git
cd laravel-session-sdk

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
laravel-session-sdk/
├── src/
│   ├── index.ts          # Main entry point
│   ├── client.ts         # LaravelSessionClient class
│   ├── database.ts       # Database adapters
│   ├── redis.ts          # Redis adapter
│   ├── express.ts        # Express middleware
│   ├── nestjs.ts         # NestJS integration
│   ├── serializer.ts     # PHP serialization
│   └── types.ts          # TypeScript types
├── test/                 # Test files
├── examples/             # Example implementations
├── dist/                 # Built files (generated)
└── docs/                 # Documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode (for development)
npm run dev
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Export public APIs with proper JSDoc comments

### Code Quality

- Write clean, readable code
- Follow DRY (Don't Repeat Yourself) principle
- Keep functions small and focused
- Use descriptive variable names
- Add comments for complex logic

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use descriptive test names

Example:

```typescript
describe('LaravelSessionClient', () => {
  describe('validateSession', () => {
    it('should return valid result for active session', async () => {
      // Arrange
      const client = new LaravelSessionClient(config);
      const sessionId = 'valid-session-id';

      // Act
      const result = await client.validateSession(sessionId);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });
  });
});
```

### Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)
- Include code examples in documentation

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**

```
feat(client): add support for PostgreSQL sessions

- Add PostgreSQL adapter
- Update documentation
- Add tests

Closes #123
```

```
fix(redis): resolve connection pool leak

The Redis adapter was not properly closing connections
when the client was destroyed, leading to connection leaks.

Fixes #456
```

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.4.0`
4. Push tag: `git push origin v1.4.0`
5. GitHub Actions will automatically publish to npm

## Getting Help

- **Documentation**: Check the [README](../README.md)
- **Issues**: Search [existing issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/aakashkanojiya91299/laravel-session-sdk/discussions)
- **Email**: Contact [aakash.wowrooms69@gmail.com](mailto:aakash.wowrooms69@gmail.com)

## Recognition

Contributors will be:
- Listed in release notes
- Credited in the README (for significant contributions)
- Given our eternal gratitude!

---

Thank you for contributing to Laravel Session SDK!
