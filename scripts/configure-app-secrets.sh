#!/bin/bash

# This script is no longer needed for Vercel deployment
# 
# The deployment has been migrated from Google Cloud Run to Vercel
# 
# For Vercel deployment, configure environment variables in:
# 1. Vercel Dashboard: Project Settings > Environment Variables
# 2. GitHub Secrets: Repository Settings > Secrets and variables > Actions
#
# Required environment variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - NEXT_PUBLIC_GATEWAY_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - GATEWAY_ADMIN_API_KEY
#
# For GitHub Actions (optional):
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
#
# See DEPLOYMENT_GUIDE.md for detailed setup instructions