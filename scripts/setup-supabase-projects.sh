#!/bin/bash

# AI Model as a Service - Supabase Project Setup Script
# This script helps you create separate Supabase projects for different environments

set -e

echo "🏗️  Setting up Supabase Environment Isolation"
echo "=============================================="

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

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

print_status "Supabase CLI found ✓"

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    print_error "You are not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

print_status "Logged in to Supabase ✓"

# Function to create a Supabase project
create_project() {
    local project_name=$1
    local environment=$2
    local region="us-east-1"  # You can change this to your preferred region
    
    print_status "Creating Supabase project: $project_name"
    
    # Check if we're on free plan and already have 2 projects
    if [ "$environment" != "development" ]; then
        local existing_projects=$(supabase projects list --output json 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
        if [ "$existing_projects" -ge 2 ]; then
            print_warning "You already have $existing_projects projects. Free plan allows only 2 projects."
            print_warning "Consider upgrading to Pro plan ($25/month) for unlimited projects."
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Project creation cancelled"
                return 1
            fi
        fi
    fi
    
    # Create the project
    local project_output
    project_output=$(supabase projects create "$project_name" --region "$region" --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        local project_id=$(echo "$project_output" | jq -r '.id')
        local project_url=$(echo "$project_output" | jq -r '.url')
        
        print_success "Created project: $project_name"
        print_status "Project ID: $project_id"
        print_status "Project URL: $project_url"
        
        # Save project info to file
        echo "SUPABASE_PROJECT_ID_${environment^^}=$project_id" >> .env.projects
        echo "SUPABASE_PROJECT_URL_${environment^^}=$project_url" >> .env.projects
        
        return 0
    else
        print_error "Failed to create project: $project_name"
        echo "$project_output"
        return 1
    fi
}

# Function to get project credentials
get_project_credentials() {
    local project_id=$1
    local environment=$2
    
    print_status "Getting credentials for project: $project_id"
    
    # Get project details
    local project_info
    project_info=$(supabase projects api-keys --project-ref "$project_id" --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        local anon_key=$(echo "$project_info" | jq -r '.anon')
        local service_role_key=$(echo "$project_info" | jq -r '.service_role')
        
        print_success "Retrieved credentials for $environment"
        
        # Save credentials to file
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY_${environment^^}=$anon_key" >> .env.credentials
        echo "SUPABASE_SERVICE_ROLE_KEY_${environment^^}=$service_role_key" >> .env.credentials
        
        return 0
    else
        print_error "Failed to get credentials for project: $project_id"
        echo "$project_info"
        return 1
    fi
}

# Main setup process
main() {
    print_status "Starting Supabase project setup..."
    
    # Remove existing files
    rm -f .env.projects .env.credentials
    
    # Create projects (Free plan allows only 2 cloud projects)
    print_status "Setting up economical development structure..."
    print_warning "Free plan allows only 2 cloud projects. Using local development for primary development."
    
    print_status "Creating staging project (Cloud Project #1)..."
    if create_project "ai-maas-staging" "staging"; then
        get_project_credentials "$(grep SUPABASE_PROJECT_ID_STAGING .env.projects | cut -d'=' -f2)" "staging"
    fi
    
    print_status "Creating production project (Cloud Project #2)..."
    if create_project "ai-maas-production" "production"; then
        get_project_credentials "$(grep SUPABASE_PROJECT_ID_PRODUCTION .env.projects | cut -d'=' -f2)" "production"
    fi
    
    print_success "Supabase project setup completed!"
    print_warning "Next steps:"
    echo "1. Review the generated .env.projects and .env.credentials files"
    echo "2. Update your environment templates with the new credentials"
    echo "3. Set up database migrations for each environment"
    echo "4. Configure your deployment pipelines to use the correct environment"
    
    print_status "Generated files:"
    echo "- .env.projects (project IDs and URLs)"
    echo "- .env.credentials (API keys for each environment)"
}

# Run main function
main "$@"
