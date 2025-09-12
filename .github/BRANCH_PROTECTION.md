# Branch Protection Configuration

## Recommended Branch Protection Rules

### For `main` branch:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require linear history
- ✅ Restrict pushes that create files larger than 100MB
- ✅ Require conversation resolution before merging

### Required Status Checks:
- `quality` - Code Quality & Security
- `test` - Testing (all matrix combinations)
- `build` - Build & Deploy
- `security-scan` - Security Scan

### For `develop` branch:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Allow force pushes (for hotfixes)

## How to Set Up Branch Protection

1. Go to your repository on GitHub
2. Navigate to Settings → Branches
3. Click "Add rule" or "Add branch protection rule"
4. Configure the rules as specified above

## Workflow Integration

The GitHub Actions workflows are designed to work with these branch protection rules:

- **PR Creation**: Triggers quality, test, and security checks
- **PR Updates**: Re-runs all checks automatically
- **Merge to main**: Triggers production deployment
- **Tag Creation**: Triggers release workflow

## Security Considerations

- All secrets are stored in GitHub Secrets
- No hardcoded credentials in workflows
- Proper token scoping for minimal permissions
- Regular security scanning and dependency updates
