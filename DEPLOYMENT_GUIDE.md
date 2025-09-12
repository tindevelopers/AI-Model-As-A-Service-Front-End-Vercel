# AI Model as a Service - Deployment Guide

## 🚀 GitHub Actions + Google Cloud Run Deployment

This guide covers the complete deployment setup for the AI Model as a Service frontend.

## 📋 Prerequisites

### 1. Google Cloud Setup
- Google Cloud Project with billing enabled
- Cloud Run API enabled
- Artifact Registry API enabled
- Service account with appropriate permissions

### 2. GitHub Repository
- Repository: `tindevelopers/AI-Model-As-A-Service`
- GitHub Actions enabled

## 🔧 Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

### Google Cloud Secrets
```bash
GCP_PROJECT_ID=your-gcp-project-id
GCP_SA_KEY={"type":"service_account",...} # Service account JSON key
```

### Application Secrets
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
NEXT_PUBLIC_GATEWAY_URL=https://your-gateway.run.app
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
GATEWAY_ADMIN_API_KEY=sk-admin-your-admin-key
```

## 🛠️ Google Cloud Setup Steps

### 1. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions" \
    --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com
```

### 2. Create Artifact Registry Repository
```bash
gcloud artifacts repositories create ai-model-service-frontend \
    --repository-format=docker \
    --location=us-central1 \
    --description="AI Model Service Frontend Docker images"
```

### 3. Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## 🔐 GitHub Secrets Configuration

### Add Secrets via GitHub CLI
```bash
# Navigate to your repository
gh secret set GCP_PROJECT_ID --body "your-project-id"
gh secret set GCP_SA_KEY --body "$(cat key.json)"

# Application secrets (get from your credential guides)
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://your-project.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "your-anon-key"
gh secret set NEXT_PUBLIC_GATEWAY_URL --body "https://your-gateway.run.app"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "your-service-role-key"
gh secret set GATEWAY_ADMIN_API_KEY --body "sk-admin-your-key"
```

### Add Secrets via GitHub Web Interface
1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the list above

## 🚀 Deployment Process

### Automatic Deployment
- **Trigger**: Push to `main` branch
- **Process**: Build → Test → Deploy to Cloud Run
- **URL**: Automatically generated Cloud Run URL

### Manual Deployment
```bash
# Build and deploy manually
gcloud run deploy ai-model-service-frontend \
    --image us-central1-docker.pkg.dev/PROJECT_ID/ai-model-service-frontend/ai-model-service-frontend:latest \
    --region us-central1 \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1
```

## 📊 Monitoring and Logs

### View Logs
```bash
# View Cloud Run logs
gcloud logs tail --follow --resource-type=cloud_run_revision \
    --resource-labels=service_name=ai-model-service-frontend

# View GitHub Actions logs
gh run list
gh run view [RUN_ID]
```

### Monitoring
- **Cloud Run Console**: Monitor performance, requests, errors
- **GitHub Actions**: Build and deployment status
- **Application Logs**: Available in Google Cloud Console

## 🔧 Configuration

### Environment Variables
All environment variables are configured via GitHub Secrets and passed to Cloud Run during deployment.

### Custom Domain (Optional)
```bash
# Map custom domain
gcloud run domain-mappings create \
    --service ai-model-service-frontend \
    --domain your-domain.com \
    --region us-central1
```

### SSL Certificate
- Automatically provisioned by Google Cloud Run
- No additional configuration needed

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
- Check GitHub Actions logs
- Verify all secrets are configured
- Ensure Dockerfile syntax is correct

**Deployment Failures**
- Check service account permissions
- Verify Artifact Registry repository exists
- Check Cloud Run quotas

**Runtime Errors**
- Check Cloud Run logs
- Verify environment variables
- Test locally with same configuration

### Debug Commands
```bash
# Check service status
gcloud run services describe ai-model-service-frontend --region us-central1

# View recent deployments
gcloud run revisions list --service ai-model-service-frontend --region us-central1

# Test service locally
docker run -p 3000:3000 \
    us-central1-docker.pkg.dev/PROJECT_ID/ai-model-service-frontend/ai-model-service-frontend:latest
```

## 📈 Scaling and Performance

### Auto Scaling
- **Min instances**: 0 (scales to zero when not in use)
- **Max instances**: 10 (adjustable based on needs)
- **Concurrency**: 100 requests per instance

### Performance Optimization
- **Cold starts**: ~2-3 seconds for Next.js
- **Memory**: 1GB (adjustable)
- **CPU**: 1 vCPU (adjustable)

## 💰 Cost Optimization

### Pricing Factors
- **Requests**: $0.40 per million requests
- **CPU time**: $0.0000024 per vCPU-second
- **Memory**: $0.0000025 per GB-second
- **Networking**: Free within Google Cloud

### Cost Reduction Tips
- Use minimum required resources
- Enable scale-to-zero
- Optimize build process
- Use efficient Docker layers

## 🔄 CI/CD Pipeline

### Workflow Steps
1. **Checkout**: Get latest code
2. **Authenticate**: Google Cloud authentication
3. **Build**: Create Docker image
4. **Push**: Upload to Artifact Registry
5. **Deploy**: Deploy to Cloud Run
6. **Release**: Create GitHub release

### Branch Strategy
- **main**: Production deployments
- **develop**: Staging deployments (configure separately)
- **feature/***: No automatic deployment

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloud Run service logs
3. Verify all prerequisites are met
4. Consult Google Cloud Run documentation
