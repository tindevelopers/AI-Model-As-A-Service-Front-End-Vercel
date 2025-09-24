# Branch Protection Rules

## Main Branch Protection

The `main` branch is protected with the following rules to ensure code quality and prevent direct modifications:

### 🛡️ Protection Rules

- **✅ Require Pull Request reviews** - All changes must go through PR
- **✅ Require 1 approving review** - At least one reviewer must approve
- **✅ Dismiss stale reviews** - Reviews are dismissed when new commits are pushed
- **✅ Enforce admins** - Even admins must follow these rules
- **❌ No force pushes allowed** - Prevents history rewriting
- **❌ No branch deletion allowed** - Prevents accidental deletion
- **✅ Delete branch on merge** - Feature branches are cleaned up automatically

### 🔒 Local Protection

Local Git hooks are installed to provide additional protection:

#### Pre-Push Hook
- Prevents direct pushes to `main` branch
- Shows helpful error message with instructions
- Forces use of Pull Requests

#### Commit Message Hook
- Enforces conventional commit format
- Ensures clean commit history
- Examples: `feat: add feature`, `fix: resolve bug`, `docs: update README`

### 📋 Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Commit your changes with conventional format
3. **Push feature branch**: `git push origin feature/your-feature-name`
4. **Create Pull Request**: Use GitHub interface to create PR
5. **Get review**: Wait for approval from team member
6. **Merge**: Merge PR into main branch
7. **Cleanup**: Feature branch is automatically deleted

### 🚫 What's Not Allowed

- Direct pushes to `main` branch
- Force pushes to `main` branch
- Deleting `main` branch
- Merging without review
- Non-conventional commit messages

### ✅ What's Allowed

- Creating feature branches
- Pushing to feature branches
- Creating Pull Requests
- Merging approved Pull Requests
- Using conventional commit format

### 🔧 Setup Commands

```bash
# Run the protection setup script
./setup-main-branch-protection.sh

# Or manually set up local hooks
chmod +x .git/hooks/pre-push
chmod +x .git/hooks/commit-msg
```

### 📝 Commit Message Format

Use conventional commit format for all commits:

```
type(scope): description

Types:
- feat: new feature
- fix: bug fix
- docs: documentation
- style: formatting
- refactor: code refactoring
- perf: performance improvement
- test: adding tests
- chore: maintenance tasks
- build: build system changes
- ci: CI/CD changes
- revert: reverting changes

Examples:
- feat(auth): add user authentication
- fix(api): resolve timeout issue
- docs: update installation guide
- refactor(components): improve error handling
```

### 🆘 Troubleshooting

If you encounter issues:

1. **"Direct pushes not allowed"**: Create a feature branch instead
2. **"Invalid commit message"**: Use conventional commit format
3. **"Push rejected"**: Check if branch protection is active
4. **"Review required"**: Create a Pull Request and get approval

### 📞 Support

For questions about branch protection:
- Check this documentation
- Review GitHub branch protection settings
- Contact team lead for exceptions
