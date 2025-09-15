#!/usr/bin/env node

/**
 * Update Supabase Auth Settings via Management API
 * This script updates the authentication configuration for your Supabase project
 */

const https = require('https');

// Configuration
const PROJECT_REF = 'zxkazryizcxvhkibtpvc';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Auth settings to update
const authSettings = {
  site_url: 'https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app',
  additional_redirect_urls: [
    'https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app',
    'https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/auth/callback',
    'https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/auth/callback?next=/',
    'https://ai-model-as-a-service-buq0xqrzm-tindeveloper.vercel.app/reset-password',
    'https://ai-maas-develop.tinconnect.com',
    'https://ai-maas-develop.tinconnect.com/auth/callback',
    'https://ai-maas-develop.tinconnect.com/auth/callback?next=/',
    'http://localhost:3000',
    'http://localhost:3000/auth/callback'
  ],
  jwt_expiry: 3600,
  enable_signup: true,
  enable_confirmations: false,
  secure_password_change: false,
  otp_expiry: 7200
};

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-CLI'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function updateAuthSettings() {
  console.log('🔧 Updating Supabase Auth Settings...');
  
  if (!ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN environment variable is required');
    console.log('💡 Run: export SUPABASE_ACCESS_TOKEN=$(npx supabase projects api-keys --project-ref zxkazryizcxvhkibtpvc)');
    process.exit(1);
  }

  try {
    // Get current settings
    console.log('📋 Fetching current auth settings...');
    const currentSettings = await makeRequest('/config/auth');
    
    if (currentSettings.status !== 200) {
      console.error('❌ Failed to fetch current settings:', currentSettings.data);
      return;
    }

    console.log('✅ Current settings retrieved');
    console.log('📝 Current site_url:', currentSettings.data.site_url);
    console.log('📝 Current redirect URLs:', currentSettings.data.additional_redirect_urls?.length || 0, 'URLs');

    // Update settings
    console.log('🔄 Updating auth settings...');
    const updateResponse = await makeRequest('/config/auth', 'PATCH', authSettings);
    
    if (updateResponse.status === 200) {
      console.log('✅ Auth settings updated successfully!');
      console.log('📝 New site_url:', authSettings.site_url);
      console.log('📝 New redirect URLs:', authSettings.additional_redirect_urls.length, 'URLs');
      console.log('📝 OTP expiry:', authSettings.otp_expiry, 'seconds');
    } else {
      console.error('❌ Failed to update settings:', updateResponse.data);
    }

  } catch (error) {
    console.error('❌ Error updating auth settings:', error.message);
  }
}

// Run the update
updateAuthSettings();
