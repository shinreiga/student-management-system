import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email for confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative w-full max-w-md">
        {/* Main Auth Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-12 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Student Management
              </h1>
              <p className="text-blue-100">
                {isSignUp ? 'Create your account to get started' : 'Welcome back! Please sign in'}
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-8">
            {/* Toggle Buttons */}
            <div className="flex mb-8 bg-gray-100 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 px-6 rounded-xl transition-all duration-300 font-medium ${
                  !isSignUp
                    ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 px-6 rounded-xl transition-all duration-300 font-medium ${
                  isSignUp
                    ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <span className="mr-2">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <span className="mr-2">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none font-medium text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">{isSignUp ? '✨' : '🚀'}</span>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </span>
                )}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-3">Secure & Protected</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-400">
                <span className="flex items-center">
                  <span className="mr-1">🔐</span>
                  Encrypted
                </span>
                <span className="flex items-center">
                  <span className="mr-1">⚡</span>
                  Fast
                </span>
                <span className="flex items-center">
                  <span className="mr-1">🛡️</span>
                  Secure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Built with Next.js & Supabase</p>
          <p className="mt-1">© 2025 Student Management System</p>
        </div>
      </div>
    </div>
  )
}