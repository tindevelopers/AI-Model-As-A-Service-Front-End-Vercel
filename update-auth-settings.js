const https = require('https');

// Supabase Management API endpoint
const projectRef = 'zxkazryizcxvhkibtpvc';
const baseUrl = 'https://api.supabase.com/v1';

// We need to get the access token from the Supabase CLI
// Let's try to extract it from the environment or use a different approach

console.log('Attempting to update Supabase auth settings...');

// Try to use the Supabase CLI to get the access token
const { execSync } = require('child_process');

try {
  // Get the access token from Supabase CLI
  const tokenResult = execSync('npx supabase projects list -o json', { encoding: 'utf8' });
  console.log('Supabase CLI is working, but we need the access token');
  
  // Let's try a different approach - use the Supabase CLI to update the project
  console.log('\nTrying to update project settings via CLI...');
  
  // Check if there's a way to update auth settings
  const helpResult = execSync('npx supabase --help', { encoding: 'utf8' });
  console.log('Available commands:', helpResult);
  
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n=== MANUAL STEPS REQUIRED ===');
console.log('The Supabase CLI does not have a direct command to update auth settings.');
console.log('You need to update the settings manually in the Supabase Dashboard:');
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/zxkazryizcxvhkibtpvc');
console.log('2. Navigate to: Authentication → Settings');
console.log('3. Find "Email" section');
console.log('4. Enable "Allow new users to sign up"');
console.log('5. Save the settings');
console.log('');
console.log('This will allow magic links to work for new users.');