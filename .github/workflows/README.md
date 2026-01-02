# GitHub Actions Workflows

This directory contains automated workflows for the Laravel Session SDK.

## Available Workflows

### 1. CI (Continuous Integration) - `ci.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**
- ✅ Tests build on Node.js 16, 18, and 20
- ✅ Installs dependencies
- ✅ Runs linter
- ✅ Builds TypeScript
- ✅ Verifies build output
- ✅ Runs tests
- ✅ Uploads build artifacts

### 2. Publish to npm - `publish.yml`

**Triggers:**
- When a new release is created on GitHub
- Manual trigger via "Actions" tab

**What it does:**
- ✅ Builds the package
- ✅ Publishes to npm registry
- ✅ Creates GitHub release (if triggered manually)

**Setup Required:**
1. Create an npm access token at https://www.npmjs.com/settings/[your-username]/tokens
2. Add it to GitHub Secrets as `NPM_TOKEN`:
   - Go to: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token

### 3. CodeQL Security Scan - `codeql.yml`

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Weekly on Sundays (scheduled)

**What it does:**
- ✅ Scans code for security vulnerabilities
- ✅ Checks for common coding errors
- ✅ Reports findings in Security tab

## How to Use

### Running CI Locally

Before pushing, test your changes:

```bash
npm install
npm run lint
npm run build
npm test
```

### Publishing a New Version

#### Option 1: Create a GitHub Release (Recommended)

1. Update version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Push the tag:
   ```bash
   git push origin main --tags
   ```

3. Go to GitHub → Releases → Create new release
4. Select the tag you just pushed
5. Publish the release
6. The workflow will automatically publish to npm

#### Option 2: Manual Workflow Trigger

1. Go to Actions tab on GitHub
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. Optionally specify a version
5. Click "Run workflow"

### Setting Up npm Token

1. **Generate npm token:**
   ```bash
   npm login
   # Then go to https://www.npmjs.com/settings/[username]/tokens
   # Create a new "Automation" token
   ```

2. **Add to GitHub Secrets:**
   - Repository → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: Your token (starts with `npm_`)
   - Click "Add secret"

## Workflow Badges

Add these to your README.md:

```markdown
![CI](https://github.com/aakashkanojiya91299/laravel-session-sdk/workflows/CI/badge.svg)
![npm version](https://badge.fury.io/js/laravel-session-sdk.svg)
![CodeQL](https://github.com/aakashkanojiya91299/laravel-session-sdk/workflows/CodeQL/badge.svg)
```

## Troubleshooting

### Workflow fails with "npm ERR! code E401"
- Check that `NPM_TOKEN` secret is correctly set
- Verify token has not expired
- Ensure token has "Automation" or "Publish" permissions

### Build fails on certain Node versions
- Check that all dependencies support the Node version
- Update `engines` field in package.json if needed

### CodeQL scan fails
- Check that code compiles successfully
- Review CodeQL logs in the workflow run
- Security issues may need to be addressed

## Local Testing of Workflows

You can use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Install act
brew install act  # macOS
# or follow instructions at https://github.com/nektos/act

# Run CI workflow
act push

# Run publish workflow (dry run)
act workflow_dispatch -W .github/workflows/publish.yml
```

## More Information

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [CodeQL Documentation](https://codeql.github.com/docs/)
