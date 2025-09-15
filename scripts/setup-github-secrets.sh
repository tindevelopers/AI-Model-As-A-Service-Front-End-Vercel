#!/bin/bash

# GitHub Secrets Setup Script for AI Model as a Service
# This script helps configure the required GitHub secrets for Vercel deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}⚙️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed"
        echo "Please install it from: https://cli.github.com/"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        print_error "Not authenticated with GitHub CLI"
        echo "Please run: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is installed and authenticated"
}

# Get Vercel project information
get_vercel_info() {
    print_header "Vercel Configuration Setup"
    
    echo "To get your Vercel information:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > General"
    echo "4. Copy the Project ID"
    echo ""
    
    read -p "Enter your Vercel Project ID for DEVELOPMENT: " VERCEL_PROJECT_ID_DEV
    read -p "Enter your Vercel Project ID for STAGING: " VERCEL_PROJECT_ID_STAGING
    read -p "Enter your Vercel Project ID for PRODUCTION: " VERCEL_PROJECT_ID_PROD
    read -p "Enter your Vercel Organization ID: " VERCEL_ORG_ID
    read -p "Enter your Vercel Token (from https://vercel.com/account/tokens): " VERCEL_TOKEN
    
    echo ""
    read -p "Enter your Vercel Alias Domain for DEV (optional): " VERCEL_ALIAS_DEV
    read -p "Enter your Vercel Alias Domain for STAGING (optional): " VERCEL_ALIAS_STAGING
}

# Get Supabase information
get_supabase_info() {
    print_header "Supabase Configuration Setup"
    
    echo "To get your Supabase information:"
    echo "1. Go to https://app.supabase.com/project"
    echo "2. Select your project"
    echo "3. Go to Settings > API"
    echo "4. Copy the Project URL and API keys"
    echo ""
    
    read -p "Enter your Supabase URL: " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
}

# Get Gateway information
get_gateway_info() {
    print_header "Gateway Configuration Setup"
    
    echo "Enter your AI Gateway configuration:"
    read -p "Enter your Gateway URL: " GATEWAY_URL
    read -p "Enter your Gateway Admin API Key: " GATEWAY_ADMIN_API_KEY
}

# Set GitHub secrets
set_github_secrets() {
    print_header "Setting GitHub Secrets"
    
    local repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
    print_status "Setting secrets for repository: $repo"
    
    # Vercel secrets
    if [ -n "$VERCEL_TOKEN" ]; then
        print_status "Setting VERCEL_TOKEN..."
        echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN --repo "$repo"
        print_success "VERCEL_TOKEN set"
    fi
    
    if [ -n "$VERCEL_ORG_ID" ]; then
        print_status "Setting VERCEL_ORG_ID..."
        echo "$VERCEL_ORG_ID" | gh secret set VERCEL_ORG_ID --repo "$repo"
        print_success "VERCEL_ORG_ID set"
    fi
    
    # Project IDs
    if [ -n "$VERCEL_PROJECT_ID_DEV" ]; then
        print_status "Setting VERCEL_PROJECT_ID_DEV..."
        echo "$VERCEL_PROJECT_ID_DEV" | gh secret set VERCEL_PROJECT_ID_DEV --repo "$repo"
        print_success "VERCEL_PROJECT_ID_DEV set"
    fi
    
    if [ -n "$VERCEL_PROJECT_ID_STAGING" ]; then
        print_status "Setting VERCEL_PROJECT_ID_STAGING..."
        echo "$VERCEL_PROJECT_ID_STAGING" | gh secret set VERCEL_PROJECT_ID_STAGING --repo "$repo"
        print_success "VERCEL_PROJECT_ID_STAGING set"
    fi
    
    if [ -n "$VERCEL_PROJECT_ID_PROD" ]; then
        print_status "Setting VERCEL_PROJECT_ID_PROD..."
        echo "$VERCEL_PROJECT_ID_PROD" | gh secret set VERCEL_PROJECT_ID_PROD --repo "$repo"
        print_success "VERCEL_PROJECT_ID_PROD set"
    fi
    
    # Alias domains
    if [ -n "$VERCEL_ALIAS_DEV" ]; then
        print_status "Setting VERCEL_ALIAS_DEV..."
        echo "$VERCEL_ALIAS_DEV" | gh secret set VERCEL_ALIAS_DEV --repo "$repo"
        print_success "VERCEL_ALIAS_DEV set"
    fi
    
    if [ -n "$VERCEL_ALIAS_STAGING" ]; then
        print_status "Setting VERCEL_ALIAS_STAGING..."
        echo "$VERCEL_ALIAS_STAGING" | gh secret set VERCEL_ALIAS_STAGING --repo "$repo"
        print_success "VERCEL_ALIAS_STAGING set"
    fi
    
    # Supabase secrets
    if [ -n "$SUPABASE_URL" ]; then
        print_status "Setting NEXT_PUBLIC_SUPABASE_URL..."
        echo "$SUPABASE_URL" | gh secret set NEXT_PUBLIC_SUPABASE_URL --repo "$repo"
        print_success "NEXT_PUBLIC_SUPABASE_URL set"
    fi
    
    if [ -n "$SUPABASE_ANON_KEY" ]; then
        print_status "Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
        echo "$SUPABASE_ANON_KEY" | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo "$repo"
        print_success "NEXT_PUBLIC_SUPABASE_ANON_KEY set"
    fi
    
    if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_status "Setting SUPABASE_SERVICE_ROLE_KEY..."
        echo "$SUPABASE_SERVICE_ROLE_KEY" | gh secret set SUPABASE_SERVICE_ROLE_KEY --repo "$repo"
        print_success "SUPABASE_SERVICE_ROLE_KEY set"
    fi
    
    # Gateway secrets
    if [ -n "$GATEWAY_URL" ]; then
        print_status "Setting NEXT_PUBLIC_GATEWAY_URL..."
        echo "$GATEWAY_URL" | gh secret set NEXT_PUBLIC_GATEWAY_URL --repo "$repo"
        print_success "NEXT_PUBLIC_GATEWAY_URL set"
    fi
    
    if [ -n "$GATEWAY_ADMIN_API_KEY" ]; then
        print_status "Setting GATEWAY_ADMIN_API_KEY..."
        echo "$GATEWAY_ADMIN_API_KEY" | gh secret set GATEWAY_ADMIN_API_KEY --repo "$repo"
        print_success "GATEWAY_ADMIN_API_KEY set"
    fi
}

# Verify secrets
verify_secrets() {
    print_header "Verifying GitHub Secrets"
    
    local repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
    
    echo "Current secrets for $repo:"
    gh secret list --repo "$repo"
}

# Main function
main() {
    print_header "GitHub Secrets Setup for AI Model as a Service"
    echo "This script will help you configure GitHub secrets for Vercel deployment"
    echo ""
    
    check_gh_cli
    
    echo ""
    print_warning "Make sure you have the following ready:"
    echo "- Vercel account and project IDs"
    echo "- Vercel API token"
    echo "- Supabase project URL and keys"
    echo "- AI Gateway URL and admin key"
    echo ""
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi
    
    get_vercel_info
    get_supabase_info
    get_gateway_info
    
    echo ""
    print_warning "About to set the following secrets:"
    echo "- VERCEL_TOKEN: ${VERCEL_TOKEN:0:10}..."
    echo "- VERCEL_ORG_ID: $VERCEL_ORG_ID"
    echo "- VERCEL_PROJECT_ID_DEV: $VERCEL_PROJECT_ID_DEV"
    echo "- VERCEL_PROJECT_ID_STAGING: $VERCEL_PROJECT_ID_STAGING"
    echo "- VERCEL_PROJECT_ID_PROD: $VERCEL_PROJECT_ID_PROD"
    echo "- SUPABASE_URL: ${SUPABASE_URL:0:20}..."
    echo "- And other configuration secrets"
    echo ""
    
    read -p "Continue with setting secrets? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi
    
    set_github_secrets
    verify_secrets
    
    echo ""
    print_success "GitHub secrets setup complete!"
    echo ""
    print_status "Next steps:"
    echo "1. Push your changes to trigger the deployment"
    echo "2. Check the GitHub Actions tab for deployment status"
    echo "3. Monitor the logs for any remaining issues"
    echo ""
    print_warning "If deployment still fails, check:"
    echo "- Vercel project is properly linked"
    echo "- Environment variables are set in Vercel dashboard"
    echo "- All required secrets are correctly configured"
}

# Run main function
main "$@"