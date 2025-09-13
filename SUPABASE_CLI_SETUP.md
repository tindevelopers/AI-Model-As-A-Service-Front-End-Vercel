# Supabase CLI Setup Guide for AI Model as a Service

## 🎯 Overview
This guide uses the Supabase CLI to automate the entire setup process. Much easier than manual setup!

## 🔑 Required Credentials from Supabase

You need **ONE** of these approaches:

### Option A: Existing Project (Recommended)
If you already created a Supabase project:
1. **Project Reference ID** (found in Settings → General)
2. **Database Password** (the one you set when creating the project)

### Option B: New Project via CLI
If you want to create everything via CLI:
1. **Supabase Account** (free signup at supabase.com)
2. **Access Token** (from Supabase Dashboard → Settings → Access Tokens)

## 🚀 CLI Setup Process

### Step 1: Login to Supabase CLI
```bash
supabase login
```
This will open your browser to authenticate with your Supabase account.

### Step 2: Initialize Supabase in Your Project
```bash
# Initialize Supabase configuration
supabase init

# This creates:
# - supabase/config.toml
# - supabase/seed.sql
# - .gitignore entries
```

### Step 3A: Link to Existing Project
If you have an existing project:
```bash
# Link to your existing project
supabase link --project-ref YOUR_PROJECT_REF

# Example:
# supabase link --project-ref abcdefghijklmnop
```

### Step 3B: Create New Project via CLI
If you want to create a new project:
```bash
# Create new project
supabase projects create "AI Model Service" --org-id YOUR_ORG_ID

# Then link to it
supabase link --project-ref NEW_PROJECT_REF
```

### Step 4: Apply Database Migrations
```bash
# Push all migrations to your remote database
supabase db push

# This will apply all files in supabase/migrations/
```

### Step 5: Generate TypeScript Types
```bash
# Generate TypeScript types from your database schema
supabase gen types typescript --linked > src/types/supabase.ts
```

### Step 6: Get Environment Variables
```bash
# Get all your environment variables
supabase status --linked

# This shows:
# - API URL
# - anon key
# - service_role key
# - Database URL
```

## 📁 Required Files Structure

The CLI expects this structure (which we've already created):
```
ai-model-service-frontend/
├── supabase/
│   ├── config.toml          # Supabase configuration
│   ├── migrations/          # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_auth_triggers.sql
│   │   └── 004_admin_functions.sql
│   └── seed.sql            # Initial data (optional)
└── src/
    └── types/
        └── supabase.ts     # Generated TypeScript types
```

## 🔧 Configuration Details

### What You Need to Provide:
1. **Supabase Account** - Free signup at supabase.com
2. **Project Reference ID** - From existing project or create new one
3. **Database Password** - Set when creating project

### What the CLI Handles:
- ✅ Database schema creation
- ✅ RLS policies setup
- ✅ Authentication configuration
- ✅ Function deployment
- ✅ TypeScript type generation
- ✅ Environment variable extraction

## 🎯 Advantages of CLI Approach

### vs Manual Setup:
- ✅ **Version Control** - All migrations tracked in git
- ✅ **Reproducible** - Same setup across environments
- ✅ **Type Safety** - Auto-generated TypeScript types
- ✅ **Automated** - No copy/paste SQL errors
- ✅ **Rollback** - Can revert migrations if needed
- ✅ **Team Friendly** - Other developers can replicate setup

### Additional Benefits:
- ✅ **Local Development** - Can run Supabase locally
- ✅ **Testing** - Separate test databases
- ✅ **CI/CD Integration** - Automated deployments
- ✅ **Schema Diffing** - Compare local vs remote

## 🚨 Important Notes

1. **Migrations are Immutable** - Once pushed, don't edit existing migration files
2. **Backup First** - CLI will ask before destructive operations
3. **Environment Variables** - CLI extracts these automatically
4. **Local Development** - Can run `supabase start` for local instance

## 🔄 Workflow After Setup

```bash
# Make schema changes
supabase migration new add_new_feature

# Edit the new migration file
# Then push changes
supabase db push

# Regenerate types
supabase gen types typescript --linked > src/types/supabase.ts

# Get updated environment variables
supabase status --linked
```

## 🎉 What You Get

After running the CLI setup:
1. **Complete Database Schema** - All tables, policies, functions
2. **TypeScript Types** - Fully typed database interactions
3. **Environment Variables** - Ready for Vercel configuration
4. **Version Controlled Setup** - Reproducible across environments
5. **Local Development Ready** - Can run Supabase locally

## 🚀 Ready to Start?

Run the automated setup script we'll create next!
