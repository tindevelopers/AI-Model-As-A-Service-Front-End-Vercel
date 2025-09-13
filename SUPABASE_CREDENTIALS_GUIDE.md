# Supabase Credentials Guide - What You Need to Get Started

## 🎯 Quick Answer: What Credentials Do You Need?

### **Minimum Required (Choose One Path):**

#### **Path A: Link to Existing Project** ⭐ Recommended
1. **Supabase Account** (free at supabase.com)
2. **Project Reference ID** (from your existing project)

#### **Path B: Create Everything via CLI**
1. **Supabase Account** (free at supabase.com)
2. **Organization ID** (from your Supabase dashboard)

That's it! The CLI handles everything else automatically.

## 🔍 Where to Find These Credentials

### **Supabase Account**
- Go to [supabase.com](https://supabase.com)
- Sign up with email/GitHub/etc (free)
- No additional setup needed

### **Project Reference ID** (if using existing project)
1. Go to your Supabase Dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

### **Organization ID** (if creating new project)
1. Go to your Supabase Dashboard
2. Look at the URL or run `supabase orgs list` after login
3. Copy the organization ID

## 🚀 Complete Setup Process

### **Step 1: Run the Automated Setup**
```bash
./scripts/setup-supabase-cli.sh
```

This script will:
1. ✅ Check if you're logged in (prompts login if needed)
2. ✅ Initialize Supabase in your project
3. ✅ Ask if you want to link existing or create new project
4. ✅ Apply all database migrations automatically
5. ✅ Generate TypeScript types
6. ✅ Extract environment variables
7. ✅ Create `.env.local` file
8. ✅ Optionally configure Vercel environment variables

### **Step 2: Create Your Admin User**
After the script completes:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click "Add user"
3. Enter your email and password
4. Check "Email Confirm"
5. Run this SQL in the SQL Editor:
```sql
UPDATE public.user_profiles 
SET role = 'superadmin' 
WHERE email = 'your-email@example.com';
```

### **Step 3: Test Everything**
```bash
npm run dev
```
Visit your local site and try signing up/signing in!

## 🔄 What the CLI Does Automatically

### **Database Setup:**
- ✅ Creates all tables (user_profiles, api_keys, usage_stats)
- ✅ Sets up Row Level Security policies
- ✅ Creates authentication triggers
- ✅ Installs admin management functions
- ✅ Configures proper indexes

### **Development Setup:**
- ✅ Generates TypeScript types from your schema
- ✅ Creates proper `.env.local` file
- ✅ Sets up Vercel environment variables
- ✅ Configures authentication settings

### **Version Control:**
- ✅ All migrations tracked in git
- ✅ Reproducible setup for team members
- ✅ Easy rollbacks if needed

## 🆚 CLI vs Manual Setup Comparison

| Feature | Manual Setup | CLI Setup |
|---------|-------------|-----------|
| **Time Required** | 30-45 minutes | 5 minutes |
| **Error Prone** | High (copy/paste SQL) | Low (automated) |
| **Version Control** | Manual tracking | Automatic |
| **TypeScript Types** | Manual generation | Automatic |
| **Team Onboarding** | Complex | One command |
| **Environment Variables** | Manual extraction | Automatic |
| **Rollbacks** | Difficult | Easy |
| **Local Development** | Complex setup | `supabase start` |

## 🎯 Recommended Workflow

### **For New Projects:**
```bash
# 1. Run the setup script
./scripts/setup-supabase-cli.sh

# 2. Create your admin user (via dashboard)

# 3. Test locally
npm run dev

# 4. Deploy
git add . && git commit -m "Add Supabase setup" && git push
```

### **For Team Members:**
```bash
# 1. Clone the repo
git clone <your-repo>

# 2. Install dependencies
npm install

# 3. Link to the project
supabase link --project-ref <project-ref>

# 4. Get environment variables
supabase status --linked > .env.local

# 5. Start developing
npm run dev
```

## 🔐 Security Notes

### **What's Safe to Share:**
- ✅ Project Reference ID
- ✅ Organization ID
- ✅ anon/public key (it's meant to be public)

### **What to Keep Secret:**
- ❌ service_role key (admin privileges)
- ❌ Database password
- ❌ Access tokens

### **Environment Variables:**
- `NEXT_PUBLIC_*` variables are safe (exposed to client)
- Other variables are server-side only (kept secret)

## 🚨 Troubleshooting

### **"Not logged in" error:**
```bash
supabase login
```

### **"Project not found" error:**
- Check your project reference ID
- Ensure you have access to the project

### **"Migration failed" error:**
- Check your database permissions
- Ensure project is properly linked

### **"Types generation failed" error:**
```bash
supabase gen types typescript --linked > src/types/supabase.ts
```

## 🎉 What You Get After Setup

1. **Complete Authentication System**
   - User signup/signin
   - Role-based access (user/admin/superadmin)
   - Secure session management

2. **Database Schema**
   - User profiles with roles
   - API key management
   - Usage tracking and analytics

3. **TypeScript Integration**
   - Fully typed database queries
   - Auto-completion in your IDE
   - Compile-time error checking

4. **Development Tools**
   - Local Supabase instance (`supabase start`)
   - Database migrations
   - Seed data for testing

5. **Production Ready**
   - Environment variables configured
   - Security policies in place
   - Scalable architecture

## 🚀 Ready to Start?

Just run:
```bash
./scripts/setup-supabase-cli.sh
```

The script will guide you through everything!
