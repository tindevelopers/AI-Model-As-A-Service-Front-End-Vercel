#!/bin/bash

# AI Model as a Service - Google Cloud Setup Script
# This script sets up all required Google Cloud resources for deployment

set -e

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI is not installed. Please install it first:"
        echo "https://cli.github.com/"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Get project configuration
get_project_config() {
    print_status "Getting project configuration..."
    
    # Get current project
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "No Google Cloud project is set. Please run:"
        echo "gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    print_success "Using project: $PROJECT_ID"
    
    # Set variables
    SERVICE_ACCOUNT_NAME="github-actions"
    SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    ARTIFACT_REGISTRY_REPO="ai-model-service-frontend"
    REGION="us-central1"
    SERVICE_NAME="ai-model-service-frontend"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    apis=(
        "run.googleapis.com"
        "artifactregistry.googleapis.com"
        "cloudbuild.googleapis.com"
        "iam.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID"
    done
    
    print_success "All APIs enabled"
}

# Create service account
create_service_account() {
    print_status "Creating service account for GitHub Actions..."
    
    # Check if service account already exists
    if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
        print_warning "Service account $SERVICE_ACCOUNT_EMAIL already exists"
    else
        gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
            --description="Service account for GitHub Actions deployment" \
            --display-name="GitHub Actions" \
            --project="$PROJECT_ID"
        
        print_success "Service account created: $SERVICE_ACCOUNT_EMAIL"
    fi
    
    # Grant necessary roles
    print_status "Granting IAM roles..."
    
    roles=(
        "roles/run.admin"
        "roles/artifactregistry.admin"
        "roles/storage.admin"
        "roles/iam.serviceAccountUser"
    )
    
    for role in "${roles[@]}"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="$role"
    done
    
    print_success "IAM roles granted"
}

# Create service account key
create_service_account_key() {
    print_status "Creating service account key..."
    
    KEY_FILE="github-actions-key.json"
    
    if [ -f "$KEY_FILE" ]; then
        print_warning "Key file $KEY_FILE already exists. Skipping creation."
        print_warning "If you need a new key, delete the existing file first."
    else
        gcloud iam service-accounts keys create "$KEY_FILE" \
            --iam-account="$SERVICE_ACCOUNT_EMAIL" \
            --project="$PROJECT_ID"
        
        print_success "Service account key created: $KEY_FILE"
        print_warning "Keep this file secure and do not commit it to version control!"
    fi
}

# Create Artifact Registry repository
create_artifact_registry() {
    print_status "Creating Artifact Registry repository..."
    
    # Check if repository already exists
    if gcloud artifacts repositories describe "$ARTIFACT_REGISTRY_REPO" \
        --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
        print_warning "Artifact Registry repository already exists"
    else
        gcloud artifacts repositories create "$ARTIFACT_REGISTRY_REPO" \
            --repository-format=docker \
            --location="$REGION" \
            --description="AI Model Service Frontend Docker images" \
            --project="$PROJECT_ID"
        
        print_success "Artifact Registry repository created"
    fi
}

# Configure GitHub secrets
configure_github_secrets() {
    print_status "Configuring GitHub repository secrets..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from your project root."
        exit 1
    fi
    
    # Get repository info
    REPO_URL=$(git remote get-url origin)
    if [[ $REPO_URL == *"github.com"* ]]; then
        # Extract owner/repo from URL
        REPO_INFO=$(echo "$REPO_URL" | sed -E 's/.*github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/\1\/\2/')
        print_status "Detected repository: $REPO_INFO"
    else
        print_error "Could not detect GitHub repository from remote origin"
        exit 1
    fi
    
    # Set GitHub secrets
    print_status "Setting GitHub secrets..."
    
    # GCP Project ID
    gh secret set GCP_PROJECT_ID --body "$PROJECT_ID"
    print_success "Set GCP_PROJECT_ID"
    
    # Service Account Key
    if [ -f "github-actions-key.json" ]; then
        gh secret set GCP_SA_KEY --body "$(cat github-actions-key.json)"
        print_success "Set GCP_SA_KEY"
    else
        print_error "Service account key file not found. Please create it first."
    fi
    
    print_success "GitHub secrets configured"
}

# Display next steps
show_next_steps() {
    print_success "Google Cloud setup complete!"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Configure application secrets in GitHub:"
    echo "   • NEXT_PUBLIC_SUPABASE_URL"
    echo "   • NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   • NEXT_PUBLIC_GATEWAY_URL"
    echo "   • SUPABASE_SERVICE_ROLE_KEY"
    echo "   • GATEWAY_ADMIN_API_KEY"
    echo ""
    echo "2. Set secrets using GitHub CLI:"
    echo "   gh secret set NEXT_PUBLIC_SUPABASE_URL --body 'https://your-project.supabase.co'"
    echo "   gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body 'your-anon-key'"
    echo "   gh secret set NEXT_PUBLIC_GATEWAY_URL --body 'https://your-gateway.run.app'"
    echo "   gh secret set SUPABASE_SERVICE_ROLE_KEY --body 'your-service-role-key'"
    echo "   gh secret set GATEWAY_ADMIN_API_KEY --body 'sk-admin-your-key'"
    echo ""
    echo "3. Or set them via GitHub web interface:"
    echo "   https://github.com/$REPO_INFO/settings/secrets/actions"
    echo ""
    echo "4. Push a commit to trigger deployment:"
    echo "   git add . && git commit -m 'Trigger deployment' && git push"
    echo ""
    echo -e "${GREEN}🚀 Your deployment pipeline is ready!${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          AI Model as a Service - GCP Setup Script           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    get_project_config
    enable_apis
    create_service_account
    create_service_account_key
    create_artifact_registry
    configure_github_secrets
    show_next_steps
}

# Run main function
main "$@"