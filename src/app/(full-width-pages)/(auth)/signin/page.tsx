import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Metadata } from "next";
import SignInFormServer from './SignInFormServer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Sign In | AI Model Service",
  description: "Sign in to your AI Model Service account",
};

export default async function SignIn() {
  // Check if user is already authenticated on the server side
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If user is already authenticated, redirect to dashboard
  if (user && !error) {
    redirect('/dashboard');
  }

  // Server-side rendered sign-in form
  return <SignInFormServer />;
}