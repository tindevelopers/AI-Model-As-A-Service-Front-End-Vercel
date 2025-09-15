import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine(v => !v.includes('placeholder.supabase.co'), { message: 'Supabase URL is placeholder' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10).refine(v => v !== 'placeholder-key', { message: 'Supabase anon key is placeholder' }),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  // Optional service role (only used server-side)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
})

const result = EnvSchema.safeParse(process.env)
if (!result.success) {
  const issues = result.error.issues.map(i => `- ${i.path.join('.')}: ${i.message}`).join('\n')
  console.error('\nEnvironment validation failed:\n' + issues + '\n')
  process.exit(1)
} else {
  console.log('Environment validation passed')
}


