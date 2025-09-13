# Supabase Setup Guide for AI Model as a Service

## 🎯 Overview
This guide will walk you through setting up Supabase as the authentication and database backend for your AI Model as a Service frontend.

## 📋 Step 1: Create Supabase Project

### 1.1 Create Account & Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `AI Model Service`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
6. Click "Create new project"
7. Wait 2-3 minutes for project initialization

### 1.2 Get Your Project Credentials
Once your project is ready:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (starts with eyJ) - **Keep this secret!**

## 📊 Step 2: Database Schema Setup

### 2.1 User Profiles Table
Go to **SQL Editor** and run this query:

```sql
-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.2 API Keys Table
```sql
-- Create API keys table for user-generated keys
CREATE TABLE public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Store hashed version of the key
  permissions TEXT[] DEFAULT ARRAY['read'],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.3 Usage Statistics Table
```sql
-- Create usage statistics table
CREATE TABLE public.usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  request_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (request_tokens + response_tokens) STORED,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  request_duration_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX idx_usage_stats_created_at ON public.usage_stats(created_at);
CREATE INDEX idx_usage_stats_api_key_id ON public.usage_stats(api_key_id);
```

## 🔐 Step 3: Row Level Security (RLS) Setup

### 3.1 Enable RLS and Create Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- API Keys Policies
CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all API keys" ON public.api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Usage Stats Policies
CREATE POLICY "Users can view own usage stats" ON public.usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage stats" ON public.usage_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
```

## 👤 Step 4: Authentication Setup

### 4.1 Configure Auth Settings
1. Go to **Authentication** → **Settings**
2. Configure these settings:
   - **Site URL**: `https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app`
   - **Redirect URLs**: Add your domain
   - **Email Templates**: Customize if needed

### 4.2 Create User Profile Trigger
```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 👑 Step 5: Create Super Admin User

### 5.1 Create Your Admin Account
1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Fill in:
   - **Email**: Your admin email
   - **Password**: Strong password
   - **Email Confirm**: Check this box
4. Click "Create user"

### 5.2 Promote to Super Admin
```sql
-- Update your user to superadmin role
UPDATE public.user_profiles 
SET role = 'superadmin' 
WHERE email = 'your-admin-email@example.com';
```

## 🔧 Step 6: Environment Variables

After completing the setup above, you'll have these credentials:

```bash
# From Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

## ✅ Step 7: Test Your Setup

### 7.1 Test Database Connection
Go to **SQL Editor** and run:
```sql
-- Test query
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as admin_users
FROM public.user_profiles;
```

### 7.2 Test Authentication
1. Try signing up a test user on your frontend
2. Check if user appears in **Authentication** → **Users**
3. Verify user profile was created in **Table Editor** → **user_profiles**

## 🚨 Security Checklist

- [ ] RLS is enabled on all tables
- [ ] Service role key is kept secret
- [ ] Admin user is created and promoted
- [ ] Auth redirect URLs are configured
- [ ] Database policies are tested

## 📞 Next Steps

Once this is complete:
1. Configure these environment variables in Vercel
2. Test authentication on your deployed frontend
3. Set up the AI Gateway backend connection

---

**Need Help?** 
- Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Test queries in SQL Editor before running
- Always backup before making schema changes
