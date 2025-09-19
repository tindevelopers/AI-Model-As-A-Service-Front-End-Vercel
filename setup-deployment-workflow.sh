#!/bin/bash

# AI Model as a Service - Deployment Workflow Setup
# This script configures branch protection and Vercel settings

echo "🚀 Setting up AI Model as a Service Deployment Workflow"
echo "========================================================"

# Repository information
REPO_OWNER="tindevelopers"
REPO_NAME="AI-Model-As-A-Service-Front-End-Vercel"
VERCEL_PROJECT="ai-model-as-a-service"

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"
echo "📋 Vercel Project: $VERCEL_PROJECT"
echo ""

# Check if we have a GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not set. Please set it with:"
    echo "   export GITHUB_TOKEN=your_github_token"
    echo ""
    echo "   You can get a token from: https://github.com/settings/tokens"
    echo "   Required scopes: repo, admin:org"
    echo ""
fi

# Function to configure branch protection via API
configure_branch_protection() {
    local branch=$1
    local description=$2
    
    echo "🔧 Configuring protection for '$branch' branch ($description)..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ Skipping API configuration (no token)"
        return
    fi
    
    # Create the protection rule
    response=$(curl -s -X PUT \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$branch/protection" \
        -d "{
            \"required_status_checks\": {
                \"strict\": true,
                \"contexts\": [\"test\"]
            },
            \"enforce_admins\": true,
            \"required_pull_request_reviews\": {
                \"required_approving_review_count\": 1,
                \"dismiss_stale_reviews\": true,
                \"require_code_owner_reviews\": false
            },
            \"restrictions\": null,
            \"allow_force_pushes\": false,
            \"allow_deletions\": false
        }")
    
    if echo "$response" | grep -q '"url"'; then
        echo "✅ Branch protection configured for '$branch'"
    else
        echo "❌ Failed to configure protection for '$branch'"
        echo "   Response: $response"
    fi
    echo ""
}

# Configure branch protection rules
echo "🔒 Setting up Branch Protection Rules..."
echo ""

configure_branch_protection "main" "Production Branch"
configure_branch_protection "staging" "Staging Branch"

echo "📝 Manual Configuration Steps:"
echo "=============================="
echo ""
echo "🔒 GITHUB BRANCH PROTECTION:"
echo "1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
echo ""
echo "2. For 'main' branch protection:"
echo "   - Click 'Add rule'"
echo "   - Branch name pattern: main"
echo "   - ✅ Require a pull request before merging"
echo "   - ✅ Require approvals: 1"
echo "   - ✅ Dismiss stale PR approvals when new commits are pushed"
echo "   - ✅ Require status checks to pass before merging"
echo "   - ✅ Require branches to be up to date before merging"
echo "   - ✅ Status checks: test"
echo "   - ✅ Include administrators"
echo ""
echo "3. For 'staging' branch protection:"
echo "   - Click 'Add rule'"
echo "   - Branch name pattern: staging"
echo "   - ✅ Require a pull request before merging"
echo "   - ✅ Require approvals: 1"
echo "   - ✅ Require status checks to pass before merging"
echo "   - ✅ Require branches to be up to date before merging"
echo "   - ✅ Status checks: test"
echo ""
echo "🌐 VERCEL CONFIGURATION:"
echo "4. Go to: https://vercel.com/tindeveloper/$VERCEL_PROJECT/settings/git"
echo ""
echo "5. Update Git Integration Settings:"
echo "   - ✅ Production Branch: main (only)"
echo "   - ✅ Preview Branches: staging, develop"
echo "   - ❌ Auto-deploy: Disabled for develop branch"
echo "   - ✅ Ignored Build Step: Leave empty"
echo ""
echo "6. Update Environment Variables (if needed):"
echo "   - Go to: https://vercel.com/tindeveloper/$VERCEL_PROJECT/settings/environment-variables"
echo "   - Ensure all required environment variables are set"
echo ""
echo "🎯 DEPLOYMENT FLOW:"
echo "develop → (PR) → staging → (PR) → main → (Auto-deploy to Production)"
echo ""
echo "✅ Current Status:"
echo "- ✅ GitHub Actions workflow updated"
echo "- ✅ Branch protection documentation created"
echo "- ✅ Deployment controls implemented"
echo "- ⏳ Manual configuration required for GitHub branch protection"
echo "- ⏳ Manual configuration required for Vercel settings"
echo ""
echo "🔍 VERIFICATION STEPS:"
echo "1. Test that direct pushes to 'main' are blocked"
echo "2. Test that direct pushes to 'staging' are blocked"
echo "3. Verify that 'develop' branch doesn't trigger production deployments"
echo "4. Test the PR workflow: develop → staging → main"
echo ""
echo "🎉 Setup complete! Please follow the manual steps above."
