# 🚨 Deployment Troubleshooting Guide

## Current Issue: Vercel Deployment Failure

Based on the [GitHub Actions failure](https://github.com/tindevelopers/AI-Model-As-A-Service/actions/runs/17741759800/job/50417334954), the deployment is failing at the "Pull Vercel Environment Information" step.

## 🔍 **Root Cause Analysis**

The error occurs because:
1. **Missing GitHub Secrets**: Required Vercel configuration secrets are not set
2. **Invalid Vercel Token**: The `VERCEL_TOKEN` secret is missing or invalid
3. **Missing Project IDs**: Branch-specific project IDs are not configured

## 🛠️ **Immediate Fix**

### Step 1: Set Up GitHub Secrets

Run the setup script to configure all required secrets:

```bash
./scripts/setup-github-secrets.sh
```

This script will guide you through setting up:
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID_DEV` - Development environment project ID
- `VERCEL_PROJECT_ID_STAGING` - Staging environment project ID
- `VERCEL_PROJECT_ID_PROD` - Production environment project ID
- Supabase configuration secrets
- Gateway configuration secrets

### Step 2: Get Vercel Information

1. **Vercel Token**:
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create a new token with full access
   - Copy the token

2. **Project IDs**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings > General
   - Copy the Project ID

3. **Organization ID**:
   - Go to [Vercel Team Settings](https://vercel.com/account/team)
   - Copy the Organization ID

### Step 3: Verify Vercel Project Setup

Ensure your Vercel project is properly configured:

1. **Link Project to Git Repository**:
   ```bash
   vercel link
   ```

2. **Set Environment Variables in Vercel**:
   - Go to your project in Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add all required environment variables

## 🔧 **Enhanced Workflow Improvements**

The workflow has been updated with better error handling:

### Before (Failing):
```yaml
- name: Pull Vercel Environment Information
  run: vercel pull --yes --environment=${{ env.VERCEL_ENV }} --token=${{ secrets.VERCEL_TOKEN }}
```

### After (Enhanced):
```yaml
- name: Pull Vercel Environment Information
  run: |
    echo "🔧 Pulling Vercel environment for ${{ env.VERCEL_ENV }}..."
    echo "Project ID: ${{ env.VERCEL_PROJECT_ID }}"
    
    # Check if Vercel token is available
    if [ -z "${{ secrets.VERCEL_TOKEN }}" ]; then
      echo "❌ VERCEL_TOKEN secret is not set"
      exit 1
    fi
    
    # Check if project ID is available
    if [ -z "${{ env.VERCEL_PROJECT_ID }}" ]; then
      echo "❌ VERCEL_PROJECT_ID is not set for this branch"
      exit 1
    fi
    
    # Pull environment information with better error handling
    vercel pull --yes --environment=${{ env.VERCEL_ENV }} --token=${{ secrets.VERCEL_TOKEN }} || {
      echo "❌ Failed to pull Vercel environment"
      echo "This might be due to:"
      echo "1. Invalid VERCEL_TOKEN"
      echo "2. Incorrect VERCEL_PROJECT_ID"
      echo "3. Project not linked to Vercel"
      exit 1
    }
    
    echo "✅ Successfully pulled Vercel environment"
```

## 📋 **Required GitHub Secrets Checklist**

- [ ] `VERCEL_TOKEN` - Vercel API token
- [ ] `VERCEL_ORG_ID` - Vercel organization ID
- [ ] `VERCEL_PROJECT_ID_DEV` - Development project ID
- [ ] `VERCEL_PROJECT_ID_STAGING` - Staging project ID
- [ ] `VERCEL_PROJECT_ID_PROD` - Production project ID
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `NEXT_PUBLIC_GATEWAY_URL` - AI Gateway URL
- [ ] `GATEWAY_ADMIN_API_KEY` - AI Gateway admin API key

## 🧪 **Testing the Fix**

1. **Set up secrets** using the provided script
2. **Push changes** to trigger deployment
3. **Monitor GitHub Actions** for deployment status
4. **Check logs** for any remaining issues

## 🚀 **Expected Outcome**

After fixing the secrets, the deployment should:
1. ✅ Successfully pull Vercel environment information
2. ✅ Build the project artifacts
3. ✅ Deploy to Vercel
4. ✅ Validate critical routes
5. ✅ Set up aliases for develop branch

## 🔄 **Branch-Specific Deployment**

The workflow deploys to different environments based on branch:

- **`main`** → Production environment
- **`staging`** → Staging environment  
- **`develop`** → Development environment (preview)

## 📞 **Support**

If issues persist after setting up secrets:

1. Check the [GitHub Actions logs](https://github.com/tindevelopers/AI-Model-As-A-Service/actions) for detailed error messages
2. Verify Vercel project is properly linked
3. Ensure all environment variables are set in Vercel dashboard
4. Check that the Vercel token has appropriate permissions

## 🎯 **Related Issues Fixed**

This deployment fix also resolves the magic link authentication issues that were preventing proper user authentication in the deployed application.
