-- AI Model as a Service - Seed Data
-- This file contains initial data for development and testing

-- Insert some sample data for development
-- Note: This will only run in local development, not production

-- Example: Insert a test admin user (only for local development)
-- You should create real users through the authentication flow

-- Sample API key permissions for reference
INSERT INTO public.api_keys (
  id,
  user_id,
  name,
  key_prefix,
  key_hash,
  permissions,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- Placeholder user ID
  'Development Test Key',
  'sk-dev',
  'hashed_key_placeholder',
  ARRAY['read', 'write'],
  true,
  NOW()
) ON CONFLICT DO NOTHING;

-- Sample usage stats for testing analytics
INSERT INTO public.usage_stats (
  user_id,
  model_name,
  provider,
  request_tokens,
  response_tokens,
  cost_usd,
  request_duration_ms,
  status,
  created_at
) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'gpt-4', 'openai', 100, 150, 0.003, 1200, 'success', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000000', 'gpt-3.5-turbo', 'openai', 80, 120, 0.0015, 800, 'success', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000000', 'claude-3', 'anthropic', 120, 180, 0.004, 1500, 'success', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- Note: The above data uses placeholder UUIDs and will not work with real authentication
-- It's just for reference and local development testing
