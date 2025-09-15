const https = require('https');

// Get access token from Supabase CLI
const { execSync } = require('child_process');

let accessToken;
try {
  // Try to get the access token from Supabase CLI
  const result = execSync('npx supabase projects list --json', { encoding: 'utf8' });
  console.log('Supabase CLI is working');
} catch (error) {
  console.error('Error with Supabase CLI:', error.message);
  process.exit(1);
}

// For now, let's try to use the Management API directly
const projectRef = 'zxkazryizcxvhkibtpvc';

// We need to get the access token from the Supabase CLI
// Let's try a different approach - use the Supabase CLI to update settings
console.log('Attempting to update Supabase project settings...');

// Try to use Supabase CLI to update the project
try {
  console.log('Updating Supabase project settings via CLI...');
  
  // First, let's try to push the local config to the remote project
  const pushResult = execSync('npx supabase db push --dry-run', { encoding: 'utf8' });
  console.log('DB push dry run result:', pushResult);
  
} catch (error) {
  console.error('Error updating settings:', error.message);
  console.log('\nManual steps required:');
  console.log('1. Go to: https://supabase.com/dashboard/project/zxkazryizcxvhkibtpvc');
  console.log('2. Navigate to: Authentication → Settings');
  console.log('3. Find "Email" section');
  console.log('4. Enable "Allow new users to sign up"');
  console.log('5. Save the settings');
}
