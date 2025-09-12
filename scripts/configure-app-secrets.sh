#!/bin/bash

# AI Model as a Service - Application Secrets Configuration Script
# This script helps configure application secrets from your credentials folder

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is available
check_github_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI is not installed. Please install it first:"
        echo "https://cli.github.com/"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &>/dev/null; then
        print_error "GitHub CLI is not authenticated. Please run:"
        echo "gh auth login"
        exit 1
    fi
}

# Function to read credentials from file
read_credential_file() {
    local file_path="$1"
    local key_name="$2"
    
    if [ -f "$file_path" ]; then
        # Try to extract the value using different patterns
        local value=""
        
        # Pattern 1: KEY=value
        value=$(grep "^${key_name}=" "$file_path" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
        
        # Pattern 2: KEY: value (YAML style)
        if [ -z "$value" ]; then
            value=$(grep "^${key_name}:" "$file_path" 2>/dev/null | cut -d':' -f2- | sed 's/^[[:space:]]*//' | tr -d '"' | tr -d "'" || echo "")
        fi
        
        echo "$value"
    else
        echo ""
    fi
}

# Function to prompt for manual input
prompt_for_value() {
    local key_name="$1"
    local description="$2"
    local is_secret="${3:-true}"
    
    echo ""
    echo -e "${YELLOW}Please enter $description:${NC}"
    if [ "$is_secret" = "true" ]; then
        read -s -p "$key_name: " value
        echo ""
    else
        read -p "$key_name: " value
    fi
    
    echo "$value"
}

# Function to set GitHub secret
set_github_secret() {
    local key_name="$1"
    local value="$2"
    
    if [ -n "$value" ]; then
        echo "$value" | gh secret set "$key_name"
        print_success "Set $key_name"
        return 0
    else
        print_warning "Skipped $key_name (empty value)"
        return 1
    fi
}

# Main configuration function
configure_secrets() {
    print_status "Configuring application secrets..."
    
    # Define credentials to configure
    declare -A credentials=(
        ["NEXT_PUBLIC_SUPABASE_URL"]="Supabase Project URL (e.g., https://your-project.supabase.co)"
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Supabase Anonymous/Public Key"
        ["NEXT_PUBLIC_GATEWAY_URL"]="Gateway API URL (e.g., https://your-gateway.run.app)"
        ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase Service Role Key (secret)"
        ["GATEWAY_ADMIN_API_KEY"]="Gateway Admin API Key (e.g., sk-admin-...)"
    )
    
    # Try to find credentials folder
    local credentials_dir=""
    local possible_dirs=(
        "../Front End Credentials"
        "../../Front End Credentials"
        "../../../Front End Credentials"
        "./Front End Credentials"
        "./credentials"
    )
    
    for dir in "${possible_dirs[@]}"; do
        if [ -d "$dir" ]; then
            credentials_dir="$dir"
            print_status "Found credentials directory: $credentials_dir"
            break
        fi
    done
    
    # Look for credential files
    local env_file=""
    if [ -n "$credentials_dir" ]; then
        local possible_files=(
            "$credentials_dir/frontend-env-template.txt"
            "$credentials_dir/.env"
            "$credentials_dir/credentials.txt"
        )
        
        for file in "${possible_files[@]}"; do
            if [ -f "$file" ]; then
                env_file="$file"
                print_status "Found credentials file: $env_file"
                break
            fi
        done
    fi
    
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              Configuring Application Secrets                ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local configured_count=0
    local total_count=${#credentials[@]}
    
    for key in "${!credentials[@]}"; do
        local description="${credentials[$key]}"
        local value=""
        
        # Try to read from file first
        if [ -n "$env_file" ]; then
            value=$(read_credential_file "$env_file" "$key")
        fi
        
        # If not found in file, prompt user
        if [ -z "$value" ]; then
            print_warning "Could not find $key in credentials file"
            
            # Ask if user wants to enter manually
            echo -n "Would you like to enter $key manually? (y/N): "
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                local is_secret="true"
                if [[ "$key" == NEXT_PUBLIC_* ]]; then
                    is_secret="false"
                fi
                value=$(prompt_for_value "$key" "$description" "$is_secret")
            fi
        else
            print_status "Found $key in credentials file"
        fi
        
        # Set the secret
        if set_github_secret "$key" "$value"; then
            ((configured_count++))
        fi
    done
    
    echo ""
    print_success "Configured $configured_count out of $total_count secrets"
    
    if [ $configured_count -lt $total_count ]; then
        print_warning "Some secrets were not configured. You can set them later using:"
        echo "gh secret set SECRET_NAME --body 'secret_value'"
        echo ""
        echo "Or via the GitHub web interface:"
        local repo_url=$(gh repo view --json url -q .url)
        echo "$repo_url/settings/secrets/actions"
    fi
}

# Display current secrets
show_current_secrets() {
    print_status "Current GitHub repository secrets:"
    echo ""
    
    # List secrets (GitHub CLI doesn't show values for security)
    if gh secret list &>/dev/null; then
        gh secret list
    else
        print_warning "Could not list secrets. Make sure you have admin access to the repository."
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         AI Model as a Service - Secrets Configuration       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_github_cli
    show_current_secrets
    echo ""
    configure_secrets
    
    echo ""
    echo -e "${GREEN}🎉 Secret configuration complete!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Verify all secrets are set correctly"
    echo "2. Push a commit to trigger deployment:"
    echo "   git add . && git commit -m 'Trigger deployment' && git push"
    echo "3. Monitor deployment at:"
    local repo_url=$(gh repo view --json url -q .url)
    echo "   $repo_url/actions"
}

# Handle command line arguments
case "${1:-}" in
    "list")
        check_github_cli
        show_current_secrets
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Configure all application secrets"
        echo "  list       Show current repository secrets"
        echo "  help       Show this help message"
        ;;
    *)
        main "$@"
        ;;
esac