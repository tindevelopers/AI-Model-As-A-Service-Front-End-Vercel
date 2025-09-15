# AI Model as a Service - Deployment Guide

## 🚀 Automated GitHub Actions + Vercel Deployment

This guide covers the complete deployment setup for the AI Model as a Service frontend using Vercel's platform.

## 📋 Prerequisites

### Required Tools
- [Vercel CLI](https://vercel.com/cli) (`vercel`)
- [GitHub CLI](https://cli.github.com/) (`gh`) (optional)
- [Node.js 18+](https://nodejs.org/) (for local development)

### Vercel Setup
- [Vercel Account](https://vercel.com/signup) (free tier available)
- Access to your AI Gateway backend service

### GitHub Setup
- Repository: `tindevelopers/AI-Model-As-A-Service`
- Admin access to configure secrets and actions

## 🛠️ Quick Setup (Recommended)

### Step 1: Create Vercel Project

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import GitHub Repository**
   - Click "New Project"
   - Import `tindevelopers/AI-Model-As-A-Service`
   - Choose "Next.js" as framework (auto-detected)

3. **Configure Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
   NEXT_PUBLIC_GATEWAY_URL=https://your-gateway.run.app
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
   GATEWAY_ADMIN_API_KEY=sk-admin-your-admin-key
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Step 2: Configure GitHub Actions (Optional)

For automated deployments with GitHub Actions, configure these secrets:

#### Vercel Secrets
```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id  
VERCEL_PROJECT_ID=your-project-id
```

#### Application Secrets
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
NEXT_PUBLIC_GATEWAY_URL=https://your-gateway.run.app
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
GATEWAY_ADMIN_API_KEY=sk-admin-your-admin-key
```

### Step 3: Get Vercel Credentials

To find your Vercel credentials:

1. **Get Vercel Token**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and get token
   vercel login
   # Go to https://vercel.com/account/tokens to create a token
   ```

2. **Get Organization ID**
   ```bash
   # In your project directory
   vercel link
   # This creates .vercel/project.json with your IDs
   cat .vercel/project.json
   ```

## 🔧 Manual Deployment (Alternative)

### Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Using Git Integration

1. **Connect Repository**
   - In Vercel dashboard, go to "Import Project"
   - Select your GitHub repository
   - Vercel will auto-deploy on every push to main

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

## 🔍 Monitoring and Troubleshooting

### Check Deployment Status

```bash
# View recent deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Check project info
vercel inspect [deployment-url]
```

### GitHub Actions Monitoring

```bash
# View recent workflow runs
gh run list --repo tindevelopers/AI-Model-As-A-Service

# View specific run details
gh run view RUN_ID --log
```

### Common Issues and Solutions

#### 1. **Build Failures**
```
Error: Build failed with exit code 1
```
**Solution:** 
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

#### 2. **Environment Variable Issues**
```
Error: Missing environment variables
```
**Solution:** 
- Add variables in Vercel dashboard under Project Settings > Environment Variables
- Ensure `NEXT_PUBLIC_` prefix for client-side variables

#### 3. **Function Timeout**
```
Error: Function execution timed out
```
**Solution:**
- Optimize API routes
- Consider upgrading Vercel plan for longer timeouts
- Check `vercel.json` function configuration

#### 4. **Domain Issues**
```
Error: Domain not found
```
**Solution:**
- Configure custom domain in Vercel dashboard
- Update DNS records as instructed by Vercel

### Debugging Commands

```bash
# Check current environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Test build locally
npm run build
npm start

# Check function logs
vercel logs --follow
```

## 🔄 Deployment Workflow

### Automatic Deployments (Git Integration)
- ✅ **Push to `main` branch** - Production deployment
- ✅ **Push to other branches** - Preview deployment
- ✅ **Pull Request** - Preview deployment with comment

### GitHub Actions Workflow
1. **Validates Secrets** - Checks all required secrets are present
2. **Builds Application** - Installs dependencies and builds Next.js app
3. **Preview Deployment** - Creates preview for PRs
4. **Production Deployment** - Deploys to production on main branch
5. **PR Comments** - Adds preview URLs to pull requests

### Deployment Triggers
- ✅ **Git Push** - Automatic via Vercel Git integration
- ✅ **GitHub Actions** - Via workflow on push/PR
- ✅ **Manual** - Via Vercel CLI or dashboard

## 🌐 Custom Domain Setup

### Add Custom Domain

1. **In Vercel Dashboard**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **DNS Configuration**
   ```
   # For apex domain (example.com)
   A record: 76.76.19.61

   # For subdomain (www.example.com)  
   CNAME record: cname.vercel-dns.com
   ```

### SSL Certificate
- ✅ **Automatic SSL** - Vercel provides free SSL certificates
- ✅ **Auto-renewal** - Certificates renew automatically
- ✅ **HTTPS redirect** - HTTP automatically redirects to HTTPS

## 📊 Performance and Scaling

### Vercel Features
- **Edge Network:** Global CDN with 100+ edge locations
- **Automatic Scaling:** Serverless functions scale automatically
- **Image Optimization:** Built-in Next.js image optimization
- **Caching:** Intelligent caching at edge locations
- **Analytics:** Built-in Web Vitals and performance monitoring

### Performance Optimizations
- ✅ **Static Generation** - Pages pre-built at build time
- ✅ **Edge Functions** - API routes run at edge locations
- ✅ **Image Optimization** - WebP/AVIF format conversion
- ✅ **Code Splitting** - Automatic bundle optimization
- ✅ **Compression** - Gzip/Brotli compression enabled

## 🔐 Security Features

- ✅ **Environment Variables** - Secure secret management
- ✅ **HTTPS Only** - Automatic SSL/TLS termination
- ✅ **Security Headers** - XSS protection, CSP, etc.
- ✅ **DDoS Protection** - Built-in protection at edge
- ✅ **Access Control** - Team-based access management

## 💰 Cost Optimization

### Free Tier Limits
- **Bandwidth:** 100GB/month
- **Function Executions:** 100GB-hours/month
- **Build Time:** 6,000 minutes/month
- **Serverless Functions:** 12 per deployment

### Pro Plan Benefits ($20/month)
- **Unlimited** bandwidth and function executions
- **Advanced analytics** and monitoring
- **Password protection** for preview deployments
- **Custom function timeout** (up to 5 minutes)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [GitHub Actions for Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Custom Domains on Vercel](https://vercel.com/docs/concepts/projects/custom-domains)

## 🆘 Support

If you encounter issues:

1. **Check Vercel Dashboard** - View build and function logs
2. **Review GitHub Actions logs** - For CI/CD pipeline errors
3. **Test locally** - Use `vercel dev` for local testing
4. **Check environment variables** - Ensure all secrets are configured
5. **Vercel Community** - [Vercel Discussions](https://github.com/vercel/vercel/discussions)

For additional help, refer to the troubleshooting section above or check the repository issues.