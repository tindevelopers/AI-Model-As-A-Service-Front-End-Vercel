#!/bin/bash

echo "🚀 Setting up GitHub Secrets for Vercel Deployment"
echo "=================================================="
echo ""

# Extract project details
PROJECT_ID="prj_gfApWXiJb3fpGDLupzo68rkPf5Gj"
ORG_ID="team_3Y0hANzD4PovKmUwUyc2WVpb"

echo "📋 Vercel Project Details:"
echo "  Project ID: $PROJECT_ID"
echo "  Org ID: $ORG_ID"
echo ""

echo "🔑 To complete the setup, you need to:"
echo "1. Create a Vercel token at: https://vercel.com/account/tokens"
echo "2. Set the following GitHub repository secrets:"
echo ""

echo "Required GitHub Secrets:"
echo "========================"
echo "VERCEL_TOKEN=<your-vercel-token-from-step-1>"
echo "VERCEL_ORG_ID=$ORG_ID"
echo "VERCEL_PROJECT_ID=$PROJECT_ID"
echo ""

echo "Application Environment Variables (also needed as GitHub secrets):"
echo "=================================================================="
echo "NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>"
echo "NEXT_PUBLIC_GATEWAY_URL=<your-gateway-url>"
echo "SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>"
echo "GATEWAY_ADMIN_API_KEY=<your-gateway-admin-api-key>"
echo ""

echo "🔗 Configure secrets at:"
echo "https://github.com/tindevelopers/AI-Model-As-A-Service/settings/secrets/actions"
echo ""

echo "📚 After setting up secrets, push any commit to main branch to trigger deployment!"

# Try to set secrets automatically if gh CLI is available and user confirms
if command -v gh &> /dev/null; then
    echo ""
    read -p "🤖 Would you like me to set the Vercel secrets automatically? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "🔑 Please enter your Vercel token: " VERCEL_TOKEN
        
        if [ ! -z "$VERCEL_TOKEN" ]; then
            echo "Setting GitHub secrets..."
            
            gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN" --repo tindevelopers/AI-Model-As-A-Service
            gh secret set VERCEL_ORG_ID --body "$ORG_ID" --repo tindevelopers/AI-Model-As-A-Service  
            gh secret set VERCEL_PROJECT_ID --body "$PROJECT_ID" --repo tindevelopers/AI-Model-As-A-Service
            
            echo "✅ Vercel secrets configured!"
            echo ""
            echo "⚠️  Don't forget to also set your application environment variables:"
            echo "   - NEXT_PUBLIC_SUPABASE_URL"
            echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
            echo "   - NEXT_PUBLIC_GATEWAY_URL"
            echo "   - SUPABASE_SERVICE_ROLE_KEY"
            echo "   - GATEWAY_ADMIN_API_KEY"
        else
            echo "❌ No token provided. Please set secrets manually."
        fi
    fi
fi
