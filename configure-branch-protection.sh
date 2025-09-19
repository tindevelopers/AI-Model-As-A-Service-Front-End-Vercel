#!/bin/bash

# Branch Protection Configuration Script
# This script helps configure branch protection rules for the AI Model as a Service repository

echo "🔒 Configuring Branch Protection Rules for AI Model as a Service"
echo "================================================================"

# Repository information
REPO_OWNER="tindevelopers"
REPO_NAME="AI-Model-As-A-Service-Front-End-Vercel"

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run:"
    echo "   gh auth login --web"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Function to create branch protection rule
create_branch_protection() {
    local branch=$1
    local require_pr=$2
    local require_approvals=$3
    local require_status_checks=$4
    local include_admins=$5
    
    echo "🔧 Configuring protection for '$branch' branch..."
    
    # Create the protection rule using GitHub API
    curl -X PUT \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: token $(gh auth token)" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$branch/protection" \
        -d "{
            \"required_status_checks\": {
                \"strict\": true,
                \"contexts\": [\"test\"]
            },
            \"enforce_admins\": $include_admins,
            \"required_pull_request_reviews\": {
                \"required_approving_review_count\": $require_approvals,
                \"dismiss_stale_reviews\": true,
                \"require_code_owner_reviews\": false
            },
            \"restrictions\": null,
            \"allow_force_pushes\": false,
            \"allow_deletions\": false
        }" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Branch protection configured for '$branch'"
    else
        echo "❌ Failed to configure protection for '$branch'"
        echo "   Please configure manually in GitHub repository settings"
    fi
    echo ""
}

# Configure main branch protection
echo "🚀 Setting up MAIN branch protection (Production)..."
create_branch_protection "main" true 1 true true

# Configure staging branch protection
echo "🧪 Setting up STAGING branch protection..."
create_branch_protection "staging" true 1 true true

echo "📝 Manual Configuration Steps:"
echo "=============================="
echo ""
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
echo "4. Vercel Configuration:"
echo "   - Go to: https://vercel.com/tindeveloper/ai-model-as-a-service/settings/git"
echo "   - ✅ Production Branch: main (only)"
echo "   - ✅ Preview Branches: staging, develop"
echo "   - ❌ Auto-deploy: Disabled for develop branch"
echo ""
echo "🎯 Deployment Flow:"
echo "develop → (PR) → staging → (PR) → main → (Auto-deploy to Production)"
echo ""
echo "✅ Configuration complete!"
