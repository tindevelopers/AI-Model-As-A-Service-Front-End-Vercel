-- Fix missing foreign key relationships
-- This migration fixes the foreign key relationships that are causing errors

-- =============================================
-- FIX TENANT_API_KEYS FOREIGN KEY
-- =============================================

-- First, check if the table exists and has the column
DO $$
BEGIN
    -- Check if tenant_api_keys table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_api_keys' AND table_schema = 'public') THEN
        -- Check if created_by column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_api_keys' AND column_name = 'created_by' AND table_schema = 'public') THEN
            -- Drop the existing foreign key constraint if it exists
            ALTER TABLE public.tenant_api_keys DROP CONSTRAINT IF EXISTS tenant_api_keys_created_by_fkey;
            
            -- Add the foreign key constraint to user_profiles
            ALTER TABLE public.tenant_api_keys 
            ADD CONSTRAINT tenant_api_keys_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Fixed tenant_api_keys foreign key relationship';
        ELSE
            RAISE NOTICE 'tenant_api_keys.created_by column does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'tenant_api_keys table does not exist';
    END IF;
END $$;

-- =============================================
-- FIX API_KEYS FOREIGN KEY
-- =============================================

-- Fix api_keys table foreign key
DO $$
BEGIN
    -- Check if api_keys table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys' AND table_schema = 'public') THEN
        -- Check if user_id column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'user_id' AND table_schema = 'public') THEN
            -- Drop the existing foreign key constraint if it exists
            ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;
            
            -- Add the foreign key constraint to user_profiles
            ALTER TABLE public.api_keys 
            ADD CONSTRAINT api_keys_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Fixed api_keys foreign key relationship';
        ELSE
            RAISE NOTICE 'api_keys.user_id column does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'api_keys table does not exist';
    END IF;
END $$;

-- =============================================
-- FIX USAGE_STATS FOREIGN KEY
-- =============================================

-- Fix usage_stats table foreign key
DO $$
BEGIN
    -- Check if usage_stats table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_stats' AND table_schema = 'public') THEN
        -- Check if user_id column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_stats' AND column_name = 'user_id' AND table_schema = 'public') THEN
            -- Drop the existing foreign key constraint if it exists
            ALTER TABLE public.usage_stats DROP CONSTRAINT IF EXISTS usage_stats_user_id_fkey;
            
            -- Add the foreign key constraint to user_profiles
            ALTER TABLE public.usage_stats 
            ADD CONSTRAINT usage_stats_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Fixed usage_stats foreign key relationship';
        ELSE
            RAISE NOTICE 'usage_stats.user_id column does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'usage_stats table does not exist';
    END IF;
END $$;

-- =============================================
-- FIX TENANT_USERS FOREIGN KEY
-- =============================================

-- Fix tenant_users table foreign key
DO $$
BEGIN
    -- Check if tenant_users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users' AND table_schema = 'public') THEN
        -- Check if user_id column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_users' AND column_name = 'user_id' AND table_schema = 'public') THEN
            -- Drop the existing foreign key constraint if it exists
            ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_user_id_fkey;
            
            -- Add the foreign key constraint to user_profiles
            ALTER TABLE public.tenant_users 
            ADD CONSTRAINT tenant_users_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Fixed tenant_users foreign key relationship';
        ELSE
            RAISE NOTICE 'tenant_users.user_id column does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'tenant_users table does not exist';
    END IF;
END $$;

-- =============================================
-- VERIFY FOREIGN KEY RELATIONSHIPS
-- =============================================

-- Create a function to verify all foreign key relationships
CREATE OR REPLACE FUNCTION verify_foreign_key_relationships()
RETURNS TABLE(
    table_name text,
    constraint_name text,
    column_name text,
    referenced_table text,
    referenced_column text,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_name::text,
        tc.constraint_name::text,
        kcu.column_name::text,
        ccu.table_name::text as referenced_table,
        ccu.column_name::text as referenced_column,
        'EXISTS'::text as status
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('tenant_api_keys', 'api_keys', 'usage_stats', 'tenant_users')
    ORDER BY tc.table_name, tc.constraint_name;
END;
$$ LANGUAGE plpgsql;

-- Call the verification function
SELECT * FROM verify_foreign_key_relationships();
