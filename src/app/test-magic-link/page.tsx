"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function TestMagicLinkPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);


  const sendMagicLink = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Magic link sent! Check your email.');
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const getDebugInfo = async () => {
    try {
      const response = await fetch('/api/test-auth-callback');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setMessage(`Failed to get debug info: ${error}`);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMessage('Signed out');
    setDebugInfo(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Magic Link Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={sendMagicLink}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>

          <button
            onClick={getDebugInfo}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Get Debug Info
          </button>

          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Sign Out
          </button>
        </div>

        {message && (
          <div className="p-3 bg-yellow-100 border border-yellow-400 rounded">
            {message}
          </div>
        )}

        {debugInfo && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
