# Manual GitHub Branch Protection Setup

Since the automated setup encountered authentication issues, here's how to manually set up GitHub branch protection:

## 🔗 GitHub Web Interface Setup

1. **Go to your repository**: https://github.com/tindevelopers/AI-Model-As-A-Service-Front-End-Vercel

2. **Navigate to Settings**:
   - Click on "Settings" tab (top right of repository page)

3. **Go to Branches**:
   - Click on "Branches" in the left sidebar

4. **Add Branch Protection Rule**:
   - Click "Add rule" button
   - In "Branch name pattern", enter: `main`

5. **Configure Protection Settings**:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (set to 1)
     - ✅ Dismiss stale PR approvals when new commits are pushed
     - ❌ Require review from code owners (optional)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require signed commits** (optional)
   - ✅ **Require linear history**
   - ❌ **Require deployments to succeed before merging** (optional)
   - ✅ **Restrict pushes that create files** (optional)

6. **Restrictions**:
   - ✅ **Restrict pushes that create files** (optional)
   - ❌ **Restrict pushes that create files larger than 100 MB** (optional)

7. **Advanced Settings**:
   - ✅ **Include administrators** (enforces rules for admins too)
   - ❌ **Allow force pushes** (keep unchecked)
   - ❌ **Allow deletions** (keep unchecked)

8. **Save the Rule**:
   - Click "Create" button

## 🧪 Test the Protection

After setting up the rules, test them:

### Test 1: Try Direct Push (Should Fail)
```bash
# Switch to main
git checkout main

# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "test: direct push test"

# Try to push (should fail)
git push origin main
```

### Test 2: Use Pull Request (Should Work)
```bash
# Create feature branch
git checkout -b test-protection

# Make a change
echo "# Test PR" >> README.md
git add README.md
git commit -m "test: pull request test"

# Push feature branch
git push origin test-protection

# Create PR via GitHub interface
# Or use: gh pr create --title "Test Protection" --body "Testing branch protection"
```

## 🔧 Local Protection Status

The local Git hooks are already installed and working:

### Pre-Push Hook
- **Location**: `.git/hooks/pre-push`
- **Purpose**: Prevents direct pushes to main branch
- **Status**: ✅ Active

### Commit Message Hook
- **Location**: `.git/hooks/commit-msg`
- **Purpose**: Enforces conventional commit format
- **Status**: ✅ Active

## 📋 Protection Summary

### ✅ What's Protected
- **Direct pushes to main**: Blocked locally and remotely
- **Force pushes**: Not allowed
- **Branch deletion**: Not allowed
- **Non-reviewed merges**: Not allowed

### ✅ What's Allowed
- **Feature branch creation**: `git checkout -b feature/name`
- **Feature branch pushes**: `git push origin feature/name`
- **Pull Request creation**: Via GitHub interface
- **Approved merges**: After review and approval

### 🎯 Workflow
1. Create feature branch from develop
2. Make changes and commit
3. Push feature branch
4. Create Pull Request to main
5. Get review and approval
6. Merge Pull Request
7. Delete feature branch

## 🆘 Troubleshooting

### If Direct Push Fails
```
error: failed to push some refs to 'github.com:...'
hint: Updates were rejected because the tip of your current branch is behind
```
**Solution**: Use Pull Request workflow instead

### If Local Hook Blocks Push
```
🚫 ERROR: Direct pushes to 'main' branch are not allowed!
```
**Solution**: Create feature branch and use Pull Request

### If Commit Message Fails
```
❌ ERROR: Invalid commit message format!
```
**Solution**: Use conventional commit format: `type: description`

## 🔄 Disable Protection (Emergency Only)

If you need to temporarily disable protection:

### GitHub (Admin Only)
1. Go to Settings → Branches
2. Edit the main branch rule
3. Uncheck protection options
4. Save changes

### Local Hooks
```bash
# Temporarily disable hooks
mv .git/hooks/pre-push .git/hooks/pre-push.disabled
mv .git/hooks/commit-msg .git/hooks/commit-msg.disabled

# Re-enable later
mv .git/hooks/pre-push.disabled .git/hooks/pre-push
mv .git/hooks/commit-msg.disabled .git/hooks/commit-msg
```

## 📞 Support

For issues with branch protection:
1. Check GitHub repository settings
2. Verify local Git hooks are active
3. Review this documentation
4. Contact team lead for exceptions

---

**Note**: This protection ensures code quality and prevents accidental direct modifications to the main branch. Always use Pull Requests for changes!
