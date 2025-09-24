'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button/Button'
import { LogIn, Users, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect to dashboard
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    // This will be handled by the useEffect redirect, but show loading just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              AI Model as a Service
            </span>
          </div>
          <Link href="/auth/signin">
            <Button
              startIcon={<LogIn className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                AI Model as a Service
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Powerful, scalable AI infrastructure for modern applications. 
                Deploy, manage, and scale your AI models with enterprise-grade security and multi-tenant architecture.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    startIcon={<LogIn className="w-5 h-5" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link href="/api-docs">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-3"
                  >
                    View API Docs
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Enterprise Security
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Multi-tenant architecture with role-based access control and comprehensive audit trails.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Multi-Tenant Management
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Create and manage multiple tenant organizations with isolated resources and billing.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Scalable Infrastructure
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Auto-scaling AI model deployment with usage analytics and performance monitoring.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Sign in to access your dashboard and start managing your AI infrastructure.
              </p>
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  startIcon={<LogIn className="w-5 h-5" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2024 AI Model as a Service. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
// Force fresh deployment with real Supabase credentials
