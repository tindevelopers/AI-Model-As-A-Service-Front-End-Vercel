# Vercel Deployment Configuration

## Current Setup

The project is now properly configured with Vercel Git integration and the following deployment rules:

### Branch Deployment Rules

1. **`develop` branch** → **Preview Deployments**
   - Triggers: Any push to `develop`
   - Environment: Preview
   - URL: `https://ai-model-as-a-service-[hash]-tindeveloper.vercel.app`
   - Purpose: Development testing and feature previews

2. **`staging` branch** → **Staging Environment**
   - Triggers: Any push to `staging`
   - Environment: Staging
   - URL: `https://ai-maas-staging.tinconnect.com` (configured in Vercel dashboard)
   - Purpose: Pre-production testing

3. **`main` branch** → **Production Environment**
   - Triggers: Only via Pull Request merges
   - Environment: Production
   - URL: `https://ai-maas-production.tinconnect.com`
   - Purpose: Live production deployment
   - **Protected**: Direct pushes to `main` are blocked by branch protection rules

### GitHub Actions Integration

The GitHub Actions workflows are configured to work with Vercel:

- **`develop-test.yml`**: Runs tests only on `develop` branch pushes
- **`ci-cd.yml`**: Runs tests and deployment logic for `main` and `staging` branches

### Vercel Configuration

The `vercel.json` file includes:
- Next.js framework configuration
- API route function settings (30s max duration)
- Security headers
- CORS configuration for API routes
- Health check endpoint rewrite

## Manual Configuration Required

Since Vercel CLI doesn't support all branch deployment settings, you'll need to configure the following manually in the Vercel dashboard:

### 1. Branch Deployment Settings
1. Go to [Vercel Dashboard](https://vercel.com/tindeveloper/ai-model-as-a-service/settings/git)
2. Under "Production Branch", set to `main`
3. Under "Preview Deployments", ensure `develop` is enabled
4. Under "Ignored Build Step", you can add custom logic if needed

### 2. Environment Variables
Configure the following environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GATEWAY_URL`
- Any other environment-specific variables

### 3. Custom Domains
- **Production**: `ai-maas-production.tinconnect.com` → `main` branch
- **Staging**: `ai-maas-staging.tinconnect.com` → `staging` branch
- **Develop**: Auto-generated preview URLs → `develop` branch

## Deployment Flow

### Development Flow
1. Developer pushes to `develop`
2. GitHub Actions runs tests
3. Vercel creates preview deployment
4. Developer tests preview URL

### Staging Flow
1. Developer creates PR from `develop` to `staging`
2. GitHub Actions runs tests
3. PR is merged to `staging`
4. Vercel deploys to staging environment

### Production Flow
1. Developer creates PR from `staging` to `main`
2. GitHub Actions runs tests
3. PR is reviewed and approved
4. PR is merged to `main`
5. Vercel deploys to production environment

## Troubleshooting

### If deployments are still happening from wrong branches:
1. Check Vercel dashboard settings
2. Verify branch protection rules in GitHub
3. Ensure GitHub Actions are not interfering
4. Check if any webhooks are configured incorrectly

### If build errors persist:
1. Check the build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Ensure all dependencies are properly configured
4. Check for any TypeScript or ESLint errors

## Security Considerations

- **Branch Protection**: `main` branch should be protected in GitHub
- **Environment Variables**: Sensitive variables should be configured in Vercel dashboard
- **API Keys**: Never commit API keys to the repository
- **CORS**: API routes have proper CORS configuration
- **Headers**: Security headers are configured for all routes