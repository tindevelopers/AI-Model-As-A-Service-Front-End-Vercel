# AI Model as a Service - Deployment Guide

## 🚀 Automated GitHub Actions + Google Cloud Run Deployment

This guide covers the complete deployment setup for the AI Model as a Service frontend using automated scripts.

## 📋 Prerequisites

### Required Tools
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- [GitHub CLI](https://cli.github.com/) (`gh`)
- [Docker](https://docs.docker.com/get-docker/) (for local testing)
- [Node.js 18+](https://nodejs.org/) (for local development)

### Google Cloud Setup
- Google Cloud Project with billing enabled
- Project owner or editor permissions
- Access to your AI Gateway backend service

### GitHub Setup
- Repository: `tindevelopers/AI-Model-As-A-Service`
- Admin access to configure secrets and actions

## 🛠️ Quick Setup (Automated)

### Step 1: Clone and Setup Google Cloud Resources

```bash
# Clone the repository
git clone https://github.com/tindevelopers/AI-Model-As-A-Service.git
cd AI-Model-As-A-Service

# Make scripts executable
chmod +x scripts/*.sh

# Set your Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# Run the automated GCP setup
./scripts/setup-gcp-deployment.sh
```

This script will:
- ✅ Enable required Google Cloud APIs
- ✅ Create service account with proper IAM roles
- ✅ Generate service account key
- ✅ Create Artifact Registry repository
- ✅ Configure GitHub secrets for GCP

### Step 2: Configure Application Secrets

```bash
# Configure application secrets from your credentials folder
./scripts/configure-app-secrets.sh
```

This script will:
- ✅ Auto-detect your credentials folder
- ✅ Extract secrets from credential files
- ✅ Set GitHub repository secrets
- ✅ Prompt for missing values

### Step 3: Trigger Deployment

```bash
# Push a commit to trigger deployment
git add .
git commit -m "Configure deployment secrets"
git push origin main
```

## 🔧 Manual Setup (Alternative)

If you prefer manual configuration or the automated scripts don't work in your environment:

### 1. Google Cloud Configuration

```bash
# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable iam.googleapis.com

# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions deployment" \
    --display-name="GitHub Actions"

# Grant roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

# Create service account key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account="github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com"

# Create Artifact Registry repository
gcloud artifacts repositories create ai-model-service-frontend \
    --repository-format=docker \
    --location=us-central1 \
    --description="AI Model Service Frontend Docker images"
```

### 2. GitHub Secrets Configuration

Configure these secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Google Cloud Secrets
```bash
GCP_PROJECT_ID=your-gcp-project-id
GCP_SA_KEY={"type":"service_account",...}  # Contents of github-actions-key.json
```

#### Application Secrets
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
NEXT_PUBLIC_GATEWAY_URL=https://your-gateway.run.app
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
GATEWAY_ADMIN_API_KEY=sk-admin-your-admin-key
```

## 🔍 Monitoring and Troubleshooting

### Check Deployment Status

```bash
# View recent workflow runs
gh run list --repo tindevelopers/AI-Model-As-A-Service

# View specific run details
gh run view RUN_ID --log

# Check Cloud Run service
gcloud run services describe ai-model-service-frontend --region=us-central1
```

### Common Issues and Solutions

#### 1. **Authentication Errors**
```
Error: google-github-actions/auth failed
```
**Solution:** Ensure `GCP_SA_KEY` secret contains valid service account JSON.

#### 2. **Permission Denied**
```
Error: Permission denied on Artifact Registry
```
**Solution:** Verify service account has `artifactregistry.admin` role.

#### 3. **Build Failures**
```
Error: Docker build failed
```
**Solution:** Check Dockerfile and ensure all dependencies are properly specified.

#### 4. **Environment Variable Issues**
```
Error: Missing environment variables
```
**Solution:** Verify all required secrets are set in GitHub repository settings.

### Debugging Commands

```bash
# Check current secrets (names only, not values)
gh secret list --repo tindevelopers/AI-Model-As-A-Service

# View service logs
gcloud logs read --service=ai-model-service-frontend --region=us-central1

# Test local build
docker build -t ai-model-service-frontend .
docker run -p 3000:3000 ai-model-service-frontend
```

## 🔄 Deployment Workflow

The GitHub Actions workflow automatically:

1. **Validates Secrets** - Checks all required secrets are present
2. **Builds Application** - Installs dependencies and builds Next.js app
3. **Creates Docker Image** - Builds optimized production container
4. **Pushes to Registry** - Uploads image to Google Artifact Registry
5. **Deploys to Cloud Run** - Updates service with new image
6. **Creates Release** - Tags successful deployments

### Deployment Triggers

- ✅ **Push to `main` branch** - Full deployment pipeline
- ✅ **Pull Request** - Build validation only (no deployment)
- ✅ **Manual trigger** - Via GitHub Actions UI

## 🌐 Custom Domain Setup

After successful deployment, you can configure a custom domain:

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create --service=ai-model-service-frontend \
    --domain=your-domain.com --region=us-central1

# Get DNS configuration
gcloud run domain-mappings describe --domain=your-domain.com --region=us-central1
```

## 📊 Performance and Scaling

The deployment is configured with:
- **Memory:** 1GB
- **CPU:** 1 vCPU
- **Concurrency:** 100 requests per instance
- **Scaling:** 0-10 instances (auto-scaling)
- **Cold starts:** Minimized with optimized Docker image

## 🔐 Security Features

- ✅ **Secrets Management** - All sensitive data stored in GitHub Secrets
- ✅ **IAM Roles** - Least-privilege service account permissions
- ✅ **HTTPS Only** - Automatic SSL/TLS termination
- ✅ **Container Security** - Multi-stage Docker builds
- ✅ **Network Security** - Cloud Run security policies

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🆘 Support

If you encounter issues:

1. **Check the automated setup logs** in the scripts output
2. **Review GitHub Actions logs** for deployment errors
3. **Verify all secrets** are properly configured
4. **Test locally** using Docker to isolate issues
5. **Check Google Cloud logs** for runtime errors

For additional help, refer to the troubleshooting section above or check the repository issues.