'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Efficient<span className="text-blue-500">Flux</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Operations Intelligence Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-gray-800 border border-gray-700 
                           rounded-lg px-4 py-3 text-white placeholder-gray-500
                           focus:outline-none focus:border-blue-500
                           transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700
                           rounded-lg px-4 py-3 text-white placeholder-gray-500
                           focus:outline-none focus:border-blue-500
                           transition-colors"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 
                              rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700
                         disabled:bg-blue-800 disabled:cursor-not-allowed
                         text-white font-semibold rounded-lg px-4 py-3
                         transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-center text-gray-500 text-sm">
              Need access? Contact{' '}
              <a href="mailto:admin@efficientflux.com" 
                 className="text-blue-400 hover:text-blue-300">
                admin@efficientflux.com
              </a>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 EfficientFlux. All rights reserved.
        </p>

      </div>
    </div>
  )
}

