#!/bin/bash

# AI Model as a Service - Database Migration Setup Script
# This script helps you set up database migrations for each Supabase environment

set -e

echo "🗄️  Setting up Database Migrations for All Environments"
echo "======================================================"

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

# Check if .env.projects file exists
if [ ! -f ".env.projects" ]; then
    print_error ".env.projects file not found. Please run setup-supabase-projects.sh first."
    exit 1
fi

# Source the project IDs
source .env.projects

# Function to run migrations on a project
run_migrations() {
    local project_id=$1
    local environment=$2
    
    print_status "Running migrations on $environment project: $project_id"
    
    # Link to the project
    supabase link --project-ref "$project_id" --force
    
    # Run migrations
    if supabase db push; then
        print_success "Migrations applied to $environment project"
    else
        print_error "Failed to apply migrations to $environment project"
        return 1
    fi
}

# Function to seed database
seed_database() {
    local project_id=$1
    local environment=$2
    
    print_status "Seeding $environment database..."
    
    # Link to the project
    supabase link --project-ref "$project_id" --force
    
    # Run seed script
    if supabase db seed; then
        print_success "Database seeded for $environment"
    else
        print_warning "Failed to seed $environment database (this might be expected if no seed data)"
    fi
}

# Main setup process
main() {
    print_status "Starting database migration setup..."
    
    # Development environment
    if [ -n "$SUPABASE_PROJECT_ID_DEVELOPMENT" ]; then
        print_status "Setting up development database..."
        run_migrations "$SUPABASE_PROJECT_ID_DEVELOPMENT" "development"
        seed_database "$SUPABASE_PROJECT_ID_DEVELOPMENT" "development"
    else
        print_warning "Development project ID not found, skipping..."
    fi
    
    # Preview environment
    if [ -n "$SUPABASE_PROJECT_ID_PREVIEW" ]; then
        print_status "Setting up preview database..."
        run_migrations "$SUPABASE_PROJECT_ID_PREVIEW" "preview"
        seed_database "$SUPABASE_PROJECT_ID_PREVIEW" "preview"
    else
        print_warning "Preview project ID not found, skipping..."
    fi
    
    # Production environment
    if [ -n "$SUPABASE_PROJECT_ID_PRODUCTION" ]; then
        print_status "Setting up production database..."
        run_migrations "$SUPABASE_PROJECT_ID_PRODUCTION" "production"
        # Don't seed production database
        print_warning "Skipping production database seeding for safety"
    else
        print_warning "Production project ID not found, skipping..."
    fi
    
    print_success "Database migration setup completed!"
    print_warning "Next steps:"
    echo "1. Verify that all environments have the correct schema"
    echo "2. Test your application with each environment"
    echo "3. Set up proper backup strategies for production"
    echo "4. Configure monitoring and alerts for each environment"
}

# Run main function
main "$@"
