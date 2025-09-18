# 🏗️ Supabase Environment Isolation Setup Guide

This guide will help you set up proper environment isolation for your AI Model as a Service application using separate Supabase projects for development, preview, and production environments.

## 📋 Overview

### Current Problem
- All environments (development, preview, production) share the same Supabase project
- Data contamination between environments
- Security risks from shared credentials
- No proper staging environment for testing

### Solution
- **Development Project**: `ai-maas-dev` - For local development and `develop` branch
- **Preview Project**: `ai-maas-preview` - For preview deployments and testing
- **Production Project**: `ai-maas-prod` - For production deployments

## 🚀 Quick Setup

### Step 1: Create Supabase Projects

```bash
# Run the automated setup script
./scripts/setup-supabase-projects.sh
```

This script will:
- Create three separate Supabase projects
- Generate project IDs and URLs
- Retrieve API keys for each environment
- Save credentials to `.env.projects` and `.env.credentials`

### Step 2: Set Up Database Migrations

```bash
# Apply migrations to all environments
./scripts/setup-database-migrations.sh
```

This script will:
- Apply your existing migrations to all three projects
- Seed development and preview databases
- Skip production seeding for safety

### Step 3: Configure Deployment Environments

```bash
# Generate environment configurations
./scripts/setup-deployment-env.sh
```

This script will:
- Generate environment files for each deployment target
- Create Vercel configuration files
- Set up GitHub Actions workflows
- Prepare deployment secrets

## 📁 Generated Files

After running the setup scripts, you'll have:

### Environment Files
- `.env.development` - Development environment variables
- `.env.preview` - Preview environment variables  
- `.env.production` - Production environment variables

### Deployment Configurations
- `vercel.development.json` - Vercel development config
- `vercel.preview.json` - Vercel preview config
- `vercel.production.json` - Vercel production config

### GitHub Actions
- `.github/workflows/deploy-development.yml`
- `.github/workflows/deploy-preview.yml`
- `.github/workflows/deploy-production.yml`

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create Supabase Projects

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create three new projects:
   - `ai-maas-dev` (Development)
   - `ai-maas-preview` (Preview/Staging)
   - `ai-maas-prod` (Production)

### 2. Get Project Credentials

For each project, get:
- Project URL (e.g., `https://ai-maas-dev.supabase.co`)
- Anon key (public key)
- Service role key (private key)

### 3. Update Environment Templates

Update the template files with your actual credentials:
- `env.development.template`
- `env.preview.template`
- `env.production.template`

### 4. Set Up Database Schema

For each project:
1. Link to the project: `supabase link --project-ref <project-id>`
2. Apply migrations: `supabase db push`
3. Seed data (dev/preview only): `supabase db seed`

## 🔐 Security Best Practices

### Environment Variables
- **Never commit** `.env.*` files to version control
- Use **different API keys** for each environment
- **Rotate keys** regularly, especially for production

### Database Access
- **Restrict database access** to specific IP ranges in production
- Use **Row Level Security (RLS)** policies
- **Monitor access logs** for suspicious activity

### Deployment Secrets
- Store secrets in your deployment platform (Vercel, GitHub)
- Use **environment-specific secrets**
- **Audit access** to production secrets

## 🚀 Deployment Configuration

### Vercel Setup

1. **Add Environment Variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add variables for each environment (Development, Preview, Production)

2. **Configure Domains**:
   - Development: `localhost:3000`
   - Preview: `ai-maas-preview.tinconnect.com`
   - Production: `ai-maas.tinconnect.com`

### GitHub Actions Setup

1. **Add Repository Secrets**:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add all required secrets for each environment

2. **Configure Branch Protection**:
   - Require pull request reviews for production
   - Require status checks to pass
   - Restrict who can push to main branch

## 📊 Monitoring and Alerts

### Set Up Monitoring
- **Database performance** monitoring for each environment
- **API response times** and error rates
- **Authentication success/failure** rates
- **Storage usage** and costs

### Configure Alerts
- **High error rates** in production
- **Unusual authentication patterns**
- **Database connection issues**
- **Cost threshold** alerts

## 🧪 Testing Strategy

### Development Environment
- **Full feature testing** with real data
- **Integration testing** with external services
- **Performance testing** with large datasets

### Preview Environment
- **Staging testing** before production deployment
- **User acceptance testing** with stakeholders
- **Load testing** with production-like data

### Production Environment
- **Smoke tests** after deployment
- **Health checks** for critical endpoints
- **Rollback procedures** if issues occur

## 🔄 Migration Strategy

### Database Migrations
1. **Test migrations** in development first
2. **Apply to preview** for validation
3. **Deploy to production** during maintenance windows
4. **Monitor** for issues after deployment

### Schema Changes
- **Backward compatible** changes preferred
- **Gradual rollout** for breaking changes
- **Data migration scripts** for large changes

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Database Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

## 🆘 Troubleshooting

### Common Issues

1. **Migration Failures**
   - Check database permissions
   - Verify migration syntax
   - Test in development first

2. **Authentication Issues**
   - Verify API keys are correct
   - Check redirect URLs in Supabase
   - Ensure cookies are set properly

3. **Environment Variable Issues**
   - Verify variable names match exactly
   - Check for typos in values
   - Ensure variables are set in deployment platform

### Getting Help

- Check the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review [Vercel Documentation](https://vercel.com/docs)
- Contact support for deployment platform issues

---

## ✅ Checklist

- [ ] Create three Supabase projects
- [ ] Set up database migrations for all environments
- [ ] Configure environment variables
- [ ] Set up deployment configurations
- [ ] Test each environment
- [ ] Set up monitoring and alerts
- [ ] Document access procedures
- [ ] Train team on new setup

Once completed, you'll have proper environment isolation with separate Supabase projects for development, preview, and production! 🎉
