-- Create test superadmin user for development
-- This user can be used to test tenant creation functionality

-- Insert test user into auth.users (this would normally be done through Supabase Auth)
-- Note: This is a development-only migration
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'superadmin@tin.info',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding profile
INSERT INTO profiles (
  id,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@tin.info'),
  'superadmin@tin.info',
  'superadmin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  role = 'superadmin',
  updated_at = NOW();

-- Grant superadmin permissions
INSERT INTO user_permissions (
  user_id,
  permission,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@tin.info'),
  'superadmin',
  NOW()
) ON CONFLICT (user_id, permission) DO NOTHING;
