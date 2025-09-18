#!/bin/bash

# AI Model as a Service - Deployment Environment Setup Script
# This script helps you set up environment variables for different deployment environments

set -e

echo "🚀 Setting up Deployment Environment Configuration"
echo "================================================="

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

# Check if required files exist
if [ ! -f ".env.projects" ] || [ ! -f ".env.credentials" ]; then
    print_error "Required files not found. Please run setup-supabase-projects.sh first."
    exit 1
fi

# Source the project and credential files
source .env.projects
source .env.credentials

# Function to generate environment file for a specific environment
generate_env_file() {
    local environment=$1
    local template_file="env.${environment}.template"
    local output_file=".env.${environment}"
    
    if [ ! -f "$template_file" ]; then
        print_error "Template file not found: $template_file"
        return 1
    fi
    
    print_status "Generating environment file for $environment..."
    
    # Copy template and replace placeholders
    cp "$template_file" "$output_file"
    
    # Replace placeholders with actual values
    case $environment in
        "development")
            sed -i.bak "s|https://ai-maas-dev.supabase.co|$SUPABASE_PROJECT_URL_DEVELOPMENT|g" "$output_file"
            sed -i.bak "s|eyJ...your-dev-anon-key-here|$NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT|g" "$output_file"
            sed -i.bak "s|eyJ...your-dev-service-role-key-here|$SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT|g" "$output_file"
            ;;
        "preview")
            sed -i.bak "s|https://ai-maas-preview.supabase.co|$SUPABASE_PROJECT_URL_PREVIEW|g" "$output_file"
            sed -i.bak "s|eyJ...your-preview-anon-key-here|$NEXT_PUBLIC_SUPABASE_ANON_KEY_PREVIEW|g" "$output_file"
            sed -i.bak "s|eyJ...your-preview-service-role-key-here|$SUPABASE_SERVICE_ROLE_KEY_PREVIEW|g" "$output_file"
            ;;
        "production")
            sed -i.bak "s|https://ai-maas-prod.supabase.co|$SUPABASE_PROJECT_URL_PRODUCTION|g" "$output_file"
            sed -i.bak "s|eyJ...your-prod-anon-key-here|$NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION|g" "$output_file"
            sed -i.bak "s|eyJ...your-prod-service-role-key-here|$SUPABASE_SERVICE_ROLE_KEY_PRODUCTION|g" "$output_file"
            ;;
    esac
    
    # Remove backup files
    rm -f "${output_file}.bak"
    
    print_success "Generated $output_file"
}

# Function to generate Vercel environment configuration
generate_vercel_env() {
    local environment=$1
    local vercel_file="vercel.${environment}.json"
    
    print_status "Generating Vercel configuration for $environment..."
    
    cat > "$vercel_file" << EOF
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "$(grep NEXT_PUBLIC_SUPABASE_URL .env.${environment} | cut -d'=' -f2)",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.${environment} | cut -d'=' -f2)",
    "NEXT_PUBLIC_GATEWAY_URL": "$(grep NEXT_PUBLIC_GATEWAY_URL .env.${environment} | cut -d'=' -f2)",
    "SUPABASE_SERVICE_ROLE_KEY": "$(grep SUPABASE_SERVICE_ROLE_KEY .env.${environment} | cut -d'=' -f2)",
    "GATEWAY_ADMIN_API_KEY": "$(grep GATEWAY_ADMIN_API_KEY .env.${environment} | cut -d'=' -f2)",
    "NODE_ENV": "$(grep NODE_ENV .env.${environment} | cut -d'=' -f2)",
    "NEXT_PUBLIC_COOKIE_DOMAIN": "$(grep NEXT_PUBLIC_COOKIE_DOMAIN .env.${environment} | cut -d'=' -f2)"
  }
}
EOF
    
    print_success "Generated $vercel_file"
}

# Function to generate GitHub Actions environment configuration
generate_github_actions_env() {
    local environment=$1
    local github_file=".github/workflows/deploy-${environment}.yml"
    
    print_status "Generating GitHub Actions configuration for $environment..."
    
    # Create .github/workflows directory if it doesn't exist
    mkdir -p .github/workflows
    
    cat > "$github_file" << EOF
name: Deploy to $environment

on:
  push:
    branches: [ $([ "$environment" = "production" ] && echo "main" || echo "$environment") ]
  pull_request:
    branches: [ $([ "$environment" = "production" ] && echo "main" || echo "$environment") ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: \${{ secrets.NEXT_PUBLIC_SUPABASE_URL_${environment^^} }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: \${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_${environment^^} }}
          NEXT_PUBLIC_GATEWAY_URL: \${{ secrets.NEXT_PUBLIC_GATEWAY_URL_${environment^^} }}
          SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_SERVICE_ROLE_KEY_${environment^^} }}
          GATEWAY_ADMIN_API_KEY: \${{ secrets.GATEWAY_ADMIN_API_KEY_${environment^^} }}
          NODE_ENV: $([ "$environment" = "development" ] && echo "development" || echo "production")
          NEXT_PUBLIC_COOKIE_DOMAIN: \${{ secrets.NEXT_PUBLIC_COOKIE_DOMAIN_${environment^^} }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
EOF
    
    print_success "Generated $github_file"
}

# Main setup process
main() {
    print_status "Starting deployment environment setup..."
    
    # Generate environment files
    for env in development preview production; do
        generate_env_file "$env"
        generate_vercel_env "$env"
        generate_github_actions_env "$env"
    done
    
    print_success "Deployment environment setup completed!"
    print_warning "Next steps:"
    echo "1. Review the generated environment files"
    echo "2. Set up secrets in your deployment platforms:"
    echo "   - Vercel: Add environment variables in project settings"
    echo "   - GitHub: Add secrets in repository settings"
    echo "3. Test deployments with each environment"
    echo "4. Set up proper monitoring and alerts"
    
    print_status "Generated files:"
    echo "- .env.development, .env.preview, .env.production"
    echo "- vercel.development.json, vercel.preview.json, vercel.production.json"
    echo "- .github/workflows/deploy-development.yml, deploy-preview.yml, deploy-production.yml"
}

# Run main function
main "$@"
