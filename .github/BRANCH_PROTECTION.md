# Branch Protection Rules

## Required GitHub Repository Settings

To ensure proper deployment flow and branch protection, configure the following settings in your GitHub repository:

### 1. Branch Protection Rules for `main` branch

**Path:** Settings → Branches → Add rule → Branch name pattern: `main`

**Required Settings:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - ✅ Status checks: `test` (from CI/CD pipeline)
- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits**
- ✅ **Require linear history**
- ✅ **Include administrators**
- ✅ **Restrict pushes that create files larger than 100 MB**

### 2. Branch Protection Rules for `staging` branch

**Path:** Settings → Branches → Add rule → Branch name pattern: `staging`

**Required Settings:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - ✅ Status checks: `test` (from CI/CD pipeline)
- ✅ **Include administrators**

### 3. Vercel Integration Settings

**Path:** Vercel Dashboard → Project Settings → Git

**Required Settings:**
- ✅ **Production Branch:** `main` (only)
- ✅ **Preview Branches:** `staging`, `develop` (for testing only)
- ✅ **Auto-deploy:** Only for `main` branch
- ❌ **Auto-deploy:** Disabled for `develop` branch

### 4. Deployment Flow

```
develop → (PR) → staging → (PR) → main → (Auto-deploy to Production)
```

1. **Development:** Work on `develop` branch
2. **Testing:** Create PR from `develop` to `staging`
3. **Staging:** Test on staging environment
4. **Production:** Create PR from `staging` to `main`
5. **Deploy:** Automatic deployment to production on merge to `main`

### 5. Security Considerations

- **No direct pushes to `main`** - All changes must go through PR
- **No direct pushes to `staging`** - All changes must go through PR
- **Code review required** for all production changes
- **Status checks must pass** before merging
- **Signed commits required** for production changes

### 6. Emergency Hotfix Process

For emergency fixes to production:

1. Create hotfix branch from `main`
2. Make minimal required changes
3. Create PR to `main` with "HOTFIX" label
4. Get expedited review and approval
5. Merge to `main` (triggers immediate production deployment)

## Implementation Checklist

- [ ] Configure branch protection rules for `main`
- [ ] Configure branch protection rules for `staging`
- [ ] Update Vercel settings to only deploy from `main`
- [ ] Test the deployment flow with a sample PR
- [ ] Verify that direct pushes to `main` are blocked
- [ ] Verify that `develop` branch doesn't trigger production deployments
