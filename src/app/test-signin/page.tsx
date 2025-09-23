"use client";
import SignInForm from "@/components/auth/SignInForm";

export default function TestSignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Test Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            This is a test page to verify signin functionality is working
          </p>
        </div>
        <div className="mt-8">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
