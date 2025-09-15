#!/bin/bash

# Complete GitHub Secrets Setup for AI Model Service Frontend
# This script sets up all required secrets using existing credentials and Vercel/Supabase CLI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Complete GitHub Secrets Setup for AI Model Service Frontend${NC}"
echo "=================================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if GitHub CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI not authenticated. Please login first:${NC}"
    echo "gh auth login"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is required but not installed. Installing via Homebrew...${NC}"
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}❌ Please install jq: brew install jq${NC}"
        exit 1
    fi
fi

# Get repository information
REPO_INFO=$(gh repo view --json owner,name)
REPO_OWNER=$(echo $REPO_INFO | jq -r '.owner.login')
REPO_NAME=$(echo $REPO_INFO | jq -r '.name')

echo -e "${GREEN}✅ Repository: ${REPO_OWNER}/${REPO_NAME}${NC}"

# =============================================================================
# VERCEL CREDENTIALS
# =============================================================================
echo ""
echo -e "${PURPLE}🔧 Setting up Vercel credentials...${NC}"

# Check if .vercel directory exists
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}⚠️  .vercel directory not found. Running 'vercel link'...${NC}"
    vercel link
fi

# Read Vercel project details
if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(jq -r '.projectId' .vercel/project.json)
    ORG_ID=$(jq -r '.orgId' .vercel/project.json)
    PROJECT_NAME=$(jq -r '.projectName' .vercel/project.json)
    
    echo -e "${BLUE}📋 Vercel Project: ${PROJECT_NAME}${NC}"
    echo -e "${BLUE}📋 Project ID: ${PROJECT_ID}${NC}"
    echo -e "${BLUE}📋 Org ID: ${ORG_ID}${NC}"
else
    echo -e "${RED}❌ Error: .vercel/project.json not found. Please run 'vercel link' first.${NC}"
    exit 1
fi

# Get Vercel token
echo ""
echo -e "${YELLOW}🔑 Vercel Token Setup:${NC}"
echo "1. Visit: https://vercel.com/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name: 'GitHub Actions - AI Model Service'"
echo "4. Copy the token"
echo ""

read -p "Enter your Vercel token: " -s VERCEL_TOKEN
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ Error: Vercel token is required.${NC}"
    exit 1
fi

# Set Vercel secrets
echo -e "${BLUE}🔐 Setting Vercel secrets...${NC}"
echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN
echo "$ORG_ID" | gh secret set VERCEL_ORG_ID
echo "$PROJECT_ID" | gh secret set VERCEL_PROJECT_ID
echo -e "${GREEN}✅ Vercel secrets configured${NC}"

# =============================================================================
# SUPABASE CREDENTIALS
# =============================================================================
echo ""
echo -e "${PURPLE}🔧 Setting up Supabase credentials...${NC}"

# Check if user wants to use Supabase CLI or manual entry
echo "Choose how to get Supabase credentials:"
echo "1. Use Supabase CLI (recommended)"
echo "2. Enter manually"
echo "3. Skip Supabase setup"
read -p "Enter choice (1-3): " SUPABASE_CHOICE

case $SUPABASE_CHOICE in
    1)
        echo -e "${BLUE}📡 Using Supabase CLI...${NC}"
        
        # Check if Supabase CLI is installed
        if ! command -v supabase &> /dev/null; then
            echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
            if command -v brew &> /dev/null; then
                brew install supabase/tap/supabase
            else
                echo -e "${RED}❌ Please install Supabase CLI: https://supabase.com/docs/guides/cli${NC}"
                exit 1
            fi
        fi
        
        # Login to Supabase if not already logged in
        if ! supabase projects list &>/dev/null; then
            echo -e "${YELLOW}🔑 Logging into Supabase...${NC}"
            supabase login
        fi
        
        # List projects and let user choose
        echo -e "${BLUE}📋 Available Supabase projects:${NC}"
        supabase projects list
        echo ""
        read -p "Enter your project reference (from the list above): " PROJECT_REF
        
        if [ ! -z "$PROJECT_REF" ]; then
            # Get project details
            PROJECT_DETAILS=$(supabase projects api-keys --project-ref $PROJECT_REF --output json)
            
            if [ $? -eq 0 ]; then
                SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
                SUPABASE_ANON_KEY=$(echo $PROJECT_DETAILS | jq -r '.anon')
                SUPABASE_SERVICE_KEY=$(echo $PROJECT_DETAILS | jq -r '.service_role')
                
                echo -e "${GREEN}✅ Retrieved Supabase credentials via CLI${NC}"
            else
                echo -e "${RED}❌ Failed to retrieve credentials via CLI. Please enter manually.${NC}"
                SUPABASE_CHOICE=2
            fi
        else
            echo -e "${YELLOW}⚠️  No project reference provided. Skipping Supabase CLI setup.${NC}"
            SUPABASE_CHOICE=2
        fi
        ;;
    2)
        echo -e "${BLUE}📝 Manual Supabase credential entry...${NC}"
        ;;
    3)
        echo -e "${YELLOW}⏭️  Skipping Supabase setup${NC}"
        ;;
esac

if [ "$SUPABASE_CHOICE" = "2" ]; then
    echo ""
    echo -e "${YELLOW}📋 Supabase Credentials (from Settings → API):${NC}"
    
    read -p "Enter your Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " -s SUPABASE_ANON_KEY
    echo ""
    read -p "Enter your Supabase Service Role Key: " -s SUPABASE_SERVICE_KEY
    echo ""
fi

# Set Supabase secrets if we have them
if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${BLUE}🔐 Setting Supabase secrets...${NC}"
    echo "$SUPABASE_URL" | gh secret set NEXT_PUBLIC_SUPABASE_URL
    echo "$SUPABASE_ANON_KEY" | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if [ ! -z "$SUPABASE_SERVICE_KEY" ]; then
        echo "$SUPABASE_SERVICE_KEY" | gh secret set SUPABASE_SERVICE_ROLE_KEY
    fi
    
    echo -e "${GREEN}✅ Supabase secrets configured${NC}"
fi

# =============================================================================
# GATEWAY API CREDENTIALS
# =============================================================================
echo ""
echo -e "${PURPLE}🔧 Setting up Gateway API credentials...${NC}"

echo "Choose how to get Gateway credentials:"
echo "1. Enter manually"
echo "2. Skip Gateway setup"
read -p "Enter choice (1-2): " GATEWAY_CHOICE

if [ "$GATEWAY_CHOICE" = "1" ]; then
    echo ""
    echo -e "${YELLOW}📋 Gateway API Credentials:${NC}"
    
    read -p "Enter your Gateway URL (https://xxx.run.app): " GATEWAY_URL
    read -p "Enter your Gateway Admin API Key (sk-admin-xxx): " -s GATEWAY_ADMIN_KEY
    echo ""
    
    # Set Gateway secrets
    if [ ! -z "$GATEWAY_URL" ]; then
        echo -e "${BLUE}🔐 Setting Gateway secrets...${NC}"
        echo "$GATEWAY_URL" | gh secret set NEXT_PUBLIC_GATEWAY_URL
        
        if [ ! -z "$GATEWAY_ADMIN_KEY" ]; then
            echo "$GATEWAY_ADMIN_KEY" | gh secret set GATEWAY_ADMIN_API_KEY
        fi
        
        echo -e "${GREEN}✅ Gateway secrets configured${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping Gateway setup${NC}"
fi

# =============================================================================
# OPTIONAL SECRETS
# =============================================================================
echo ""
echo -e "${PURPLE}🔧 Optional secrets setup...${NC}"

# Release token for automatic releases
read -p "Do you want to enable automatic releases? (y/n): " CREATE_RELEASES
if [[ $CREATE_RELEASES =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}🔑 GitHub Release Token Setup:${NC}"
    echo "1. Visit: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo ""
    read -p "Enter your GitHub token for releases: " -s RELEASE_TOKEN
    echo ""
    if [ ! -z "$RELEASE_TOKEN" ]; then
        echo "$RELEASE_TOKEN" | gh secret set RELEASE_TOKEN
        echo -e "${GREEN}✅ Release token configured${NC}"
    fi
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${GREEN}🎉 GitHub secrets setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Configured secrets:${NC}"
echo "✅ VERCEL_TOKEN"
echo "✅ VERCEL_ORG_ID"
echo "✅ VERCEL_PROJECT_ID"

if [ ! -z "$SUPABASE_URL" ]; then echo "✅ NEXT_PUBLIC_SUPABASE_URL"; fi
if [ ! -z "$SUPABASE_ANON_KEY" ]; then echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY"; fi
if [ ! -z "$SUPABASE_SERVICE_KEY" ]; then echo "✅ SUPABASE_SERVICE_ROLE_KEY"; fi
if [ ! -z "$GATEWAY_URL" ]; then echo "✅ NEXT_PUBLIC_GATEWAY_URL"; fi
if [ ! -z "$GATEWAY_ADMIN_KEY" ]; then echo "✅ GATEWAY_ADMIN_API_KEY"; fi
if [ ! -z "$RELEASE_TOKEN" ]; then echo "✅ RELEASE_TOKEN"; fi

echo ""
echo -e "${GREEN}🚀 Your next push to main branch will trigger automatic deployment!${NC}"
echo ""
echo -e "${BLUE}📚 View your secrets at:${NC}"
echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/secrets/actions"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Test the build locally: npm run test:build"
echo "2. Commit and push your changes"
echo "3. Check GitHub Actions for successful deployment"
