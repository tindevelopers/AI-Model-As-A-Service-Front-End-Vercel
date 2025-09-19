#!/bin/bash

# AI Model as a Service - Main Branch Protection Setup
# This script sets up branch protection rules for the main branch

echo "🛡️  Setting up Main Branch Protection Rules"
echo "=============================================="

# Repository details
REPO_OWNER="tindevelopers"
REPO_NAME="AI-Model-As-A-Service-Front-End-Vercel"
BRANCH="main"

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"
echo "🌿 Protected Branch: $BRANCH"
echo ""

# Function to create branch protection rule
create_branch_protection() {
    echo "🔒 Creating GitHub branch protection rule..."
    
    # Create the protection rule using GitHub API
    curl -X PUT \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
        -d '{
            "required_status_checks": {
                "strict": true,
                "contexts": []
            },
            "enforce_admins": true,
            "required_pull_request_reviews": {
                "required_approving_review_count": 1,
                "dismiss_stale_reviews": true,
                "require_code_owner_reviews": false,
                "require_last_push_approval": false
            },
            "restrictions": {
                "users": [],
                "teams": [],
                "apps": []
            },
            "allow_force_pushes": false,
            "allow_deletions": false,
            "required_linear_history": false,
            "allow_squash_merge": true,
            "allow_merge_commit": true,
            "allow_rebase_merge": false,
            "allow_auto_merge": false,
            "delete_branch_on_merge": true
        }'
    
    if [ $? -eq 0 ]; then
        echo "✅ GitHub branch protection rule created successfully!"
    else
        echo "❌ Failed to create GitHub branch protection rule"
        echo "   Make sure GITHUB_TOKEN is set and has proper permissions"
        return 1
    fi
}

# Function to create local Git hooks
create_local_hooks() {
    echo ""
    echo "🔧 Setting up local Git hooks..."
    
    # Create pre-push hook to prevent direct pushes to main
    cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Pre-push hook to prevent direct pushes to main branch
# This provides local protection as a backup to GitHub branch protection

protected_branches=("main")

while read local_ref local_sha remote_ref remote_sha; do
    if [[ -z "$local_ref" || -z "$remote_ref" ]]; then
        continue
    fi
    
    # Extract branch name from remote ref
    branch_name=${remote_ref#refs/heads/}
    
    # Check if pushing to a protected branch
    for protected in "${protected_branches[@]}"; do
        if [[ "$branch_name" == "$protected" ]]; then
            echo ""
            echo "🚫 ERROR: Direct pushes to '$protected' branch are not allowed!"
            echo "   Please use Pull Requests to update the main branch."
            echo "   Create a feature branch and submit a Pull Request instead."
            echo ""
            exit 1
        fi
    done
done

exit 0
EOF

    # Make the hook executable
    chmod +x .git/hooks/pre-push
    
    echo "✅ Local pre-push hook created"
    echo "   This will prevent direct pushes to main branch locally"
}

# Function to create commit-msg hook for conventional commits
create_commit_hook() {
    echo ""
    echo "📝 Setting up commit message hook..."
    
    cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Commit message hook to enforce conventional commit format
# This helps maintain clean commit history

commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo ""
    echo "❌ ERROR: Invalid commit message format!"
    echo ""
    echo "   Please use conventional commit format:"
    echo "   type(scope): description"
    echo ""
    echo "   Examples:"
    echo "   - feat: add new feature"
    echo "   - fix: resolve bug in component"
    echo "   - docs: update README"
    echo "   - refactor(api): improve error handling"
    echo ""
    echo "   Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert"
    echo ""
    exit 1
fi

echo "✅ Commit message format is valid"
exit 0
EOF

    # Make the hook executable
    chmod +x .git/hooks/commit-msg
    
    echo "✅ Commit message hook created"
    echo "   This enforces conventional commit format"
}

# Function to display protection status
show_protection_status() {
    echo ""
    echo "📊 Branch Protection Status:"
    echo "=========================="
    
    # Check if GitHub token is available
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "✅ GitHub Token: Available"
        echo "🔒 GitHub Protection: Will be enabled"
    else
        echo "⚠️  GitHub Token: Not found"
        echo "   Set GITHUB_TOKEN environment variable to enable GitHub protection"
    fi
    
    echo "🔧 Local Hooks: Enabled"
    echo "   - Pre-push hook: Prevents direct pushes to main"
    echo "   - Commit-msg hook: Enforces conventional commits"
    echo ""
    echo "📋 Protection Rules:"
    echo "   - ✅ Require Pull Request reviews"
    echo "   - ✅ Require 1 approving review"
    echo "   - ✅ Dismiss stale reviews"
    echo "   - ✅ Enforce admins"
    echo "   - ❌ No force pushes allowed"
    echo "   - ❌ No branch deletion allowed"
    echo "   - ✅ Delete branch on merge"
}

# Main execution
main() {
    echo "🚀 Starting branch protection setup..."
    echo ""
    
    # Create GitHub protection if token is available
    if [ -n "$GITHUB_TOKEN" ]; then
        create_branch_protection
    else
        echo "⚠️  Skipping GitHub protection (no token)"
        echo "   To enable GitHub protection, set GITHUB_TOKEN environment variable"
    fi
    
    # Always create local hooks as backup
    create_local_hooks
    create_commit_hook
    
    # Show status
    show_protection_status
    
    echo ""
    echo "🎉 Branch protection setup complete!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the protection by trying to push directly to main"
    echo "   2. Create a feature branch for new changes"
    echo "   3. Submit Pull Requests for all main branch updates"
    echo ""
    echo "💡 Tip: Use 'git checkout -b feature/your-feature-name' to create feature branches"
}

# Run main function
main
