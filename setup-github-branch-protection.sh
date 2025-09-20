#!/bin/bash

# AI Model as a Service - GitHub Branch Protection Setup
# This script sets up GitHub branch protection rules for the main branch

echo "🛡️  Setting up GitHub Branch Protection Rules"
echo "=============================================="

# Repository details
REPO_OWNER="tindevelopers"
REPO_NAME="AI-Model-As-A-Service-Front-End-Vercel"
BRANCH="main"

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"
echo "🌿 Protected Branch: $BRANCH"
echo ""

# Function to check authentication
check_auth() {
    echo "🔐 Checking GitHub authentication..."
    
    # Check if gh CLI is authenticated
    if gh auth status &>/dev/null; then
        echo "✅ GitHub CLI is authenticated"
        return 0
    else
        echo "❌ GitHub CLI authentication failed"
        return 1
    fi
}

# Function to setup branch protection using GitHub CLI
setup_protection_gh_cli() {
    echo "🚀 Setting up branch protection using GitHub CLI..."
    
    # Use the JSON file we created
    if gh api repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection --method PUT --input branch-protection.json; then
        echo "✅ GitHub branch protection rule created successfully!"
        return 0
    else
        echo "❌ Failed to create GitHub branch protection rule"
        return 1
    fi
}

# Function to setup branch protection using curl
setup_protection_curl() {
    echo "🌐 Setting up branch protection using curl..."
    
    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ GITHUB_TOKEN environment variable not set"
        echo "   Please set your GitHub token: export GITHUB_TOKEN=your_token_here"
        return 1
    fi
    
    # Make the API call
    response=$(curl -s -w "%{http_code}" -X PUT \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: token $GITHUB_TOKEN" \
        -d @branch-protection.json \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection")
    
    # Extract HTTP status code
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ GitHub branch protection rule created successfully!"
        echo "Response: $response_body"
        return 0
    else
        echo "❌ Failed to create GitHub branch protection rule"
        echo "HTTP Code: $http_code"
        echo "Response: $response_body"
        return 1
    fi
}

# Function to display manual setup instructions
show_manual_setup() {
    echo ""
    echo "📖 Manual Setup Instructions:"
    echo "============================"
    echo ""
    echo "1. Go to your repository:"
    echo "   https://github.com/$REPO_OWNER/$REPO_NAME"
    echo ""
    echo "2. Navigate to Settings → Branches"
    echo ""
    echo "3. Click 'Add rule' and enter 'main' as branch name pattern"
    echo ""
    echo "4. Configure these settings:"
    echo "   ✅ Require a pull request before merging"
    echo "     ✅ Require approvals (set to 1)"
    echo "     ✅ Dismiss stale PR approvals when new commits are pushed"
    echo "     ❌ Require review from code owners"
    echo "   ✅ Require status checks to pass before merging"
    echo "     ✅ Require branches to be up to date before merging"
    echo "   ✅ Require conversation resolution before merging"
    echo "   ✅ Require linear history"
    echo "   ✅ Include administrators"
    echo "   ❌ Allow force pushes"
    echo "   ❌ Allow deletions"
    echo "   ✅ Delete head branches when merged"
    echo ""
    echo "5. Click 'Create' to save the rule"
    echo ""
}

# Function to test the protection
test_protection() {
    echo ""
    echo "🧪 Testing Branch Protection:"
    echo "============================"
    echo ""
    echo "1. Create a test branch:"
    echo "   git checkout -b test-protection"
    echo ""
    echo "2. Make a small change:"
    echo "   echo '# Test' >> README.md"
    echo "   git add README.md"
    echo "   git commit -m 'test: protection test'"
    echo ""
    echo "3. Try to push directly to main (should fail):"
    echo "   git checkout main"
    echo "   git push origin main"
    echo ""
    echo "4. Push test branch (should work):"
    echo "   git checkout test-protection"
    echo "   git push origin test-protection"
    echo ""
    echo "5. Create Pull Request via GitHub interface"
    echo ""
}

# Function to show current protection status
show_status() {
    echo ""
    echo "📊 Current Protection Status:"
    echo "============================"
    
    # Try to get current protection status
    if gh api repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection &>/dev/null; then
        echo "✅ Branch protection is ACTIVE"
        echo "   Main branch is protected with the configured rules"
    else
        echo "❌ Branch protection is NOT ACTIVE"
        echo "   Main branch can be pushed to directly"
    fi
    
    echo ""
    echo "🔧 Local Protection:"
    if [ -f ".git/hooks/pre-push" ]; then
        echo "   ✅ Pre-push hook: ACTIVE"
    else
        echo "   ❌ Pre-push hook: NOT ACTIVE"
    fi
    
    if [ -f ".git/hooks/commit-msg" ]; then
        echo "   ✅ Commit-msg hook: ACTIVE"
    else
        echo "   ❌ Commit-msg hook: NOT ACTIVE"
    fi
}

# Main execution
main() {
    echo "🚀 Starting GitHub branch protection setup..."
    echo ""
    
    # Check authentication
    if ! check_auth; then
        echo ""
        echo "🔧 Authentication Setup Required:"
        echo "================================"
        echo ""
        echo "Option 1 - GitHub CLI (Recommended):"
        echo "  gh auth login --web"
        echo ""
        echo "Option 2 - Personal Access Token:"
        echo "  export GITHUB_TOKEN=your_personal_access_token"
        echo "  # Get token from: https://github.com/settings/tokens"
        echo ""
        echo "Option 3 - Manual Setup:"
        show_manual_setup
        exit 1
    fi
    
    # Try GitHub CLI first
    if setup_protection_gh_cli; then
        echo ""
        echo "🎉 GitHub branch protection setup complete!"
    else
        echo ""
        echo "⚠️  GitHub CLI failed, trying curl method..."
        if setup_protection_curl; then
            echo ""
            echo "🎉 GitHub branch protection setup complete!"
        else
            echo ""
            echo "❌ Both automated methods failed"
            echo ""
            show_manual_setup
        fi
    fi
    
    # Show status
    show_status
    
    # Show testing instructions
    test_protection
    
    echo ""
    echo "📝 Next Steps:"
    echo "============="
    echo "1. Test the protection by trying to push directly to main"
    echo "2. Create feature branches for new changes"
    echo "3. Submit Pull Requests for all main branch updates"
    echo "4. Verify protection is working as expected"
    echo ""
    echo "💡 Tip: Use 'git checkout -b feature/your-feature-name' to create feature branches"
}

# Run main function
main
