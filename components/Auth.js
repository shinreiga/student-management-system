import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isReset) {
        // Password reset - Use current domain
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        })
        if (error) throw error
        alert('Password reset link sent to your email!')
        setIsReset(false)
      } else if (isSignUp) {
        // Sign up with proper redirect
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        })
        if (error) throw error
        alert('Check your email for confirmation link!')
      } else {
        // Sign in
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleAuth} className="space-y-4 max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isReset ? 'Reset Password' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </h2>
        
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {!isReset && (
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : (isReset ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In'))}
        </button>
        
        <div className="text-center space-y-2">
          {!isReset ? (
            <>
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-500 ml-1 hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => setIsReset(true)}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Forgot your password?
                </button>
              </p>
            </>
          ) : (
            <p>
              <button
                type="button"
                onClick={() => setIsReset(false)}
                className="text-blue-500 hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}