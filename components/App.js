import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'
import Auth from './Auth'

// Reset Password Component
function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Check for stored reset tokens first
    const resetAccessToken = sessionStorage.getItem('reset_access_token')
    const resetRefreshToken = sessionStorage.getItem('reset_refresh_token')
    
    if (resetAccessToken && resetRefreshToken) {
      // Set session with the reset tokens
      supabase.auth.setSession({
        access_token: resetAccessToken,
        refresh_token: resetRefreshToken
      }).then(({ data: { session }, error }) => {
        if (!error && session) {
          setSession(session)
          // Clear the stored tokens
          sessionStorage.removeItem('reset_access_token')
          sessionStorage.removeItem('reset_refresh_token')
        }
      })
    } else {
      // Normal session check
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long!')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        alert('Error updating password: ' + error.message)
      } else {
        alert('Password updated successfully!')
        // Clear any reset flow indicators
        sessionStorage.removeItem('reset_access_token')
        sessionStorage.removeItem('reset_refresh_token')
        // Redirect to dashboard
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    }

    setLoading(false)
  }

  if (!session) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2>Invalid Reset Link</h2>
          <p>This password reset link is invalid or has expired.</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f8f9fa'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Reset Your Password
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: 'bold'
            }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: 'bold'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Auth Callback Handler Component
function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log('Auth callback type:', type)

        if (type === 'recovery' && accessToken && refreshToken) {
          // Store the tokens temporarily and redirect to reset password
          sessionStorage.setItem('reset_access_token', accessToken)
          sessionStorage.setItem('reset_refresh_token', refreshToken)
          
          // Clear hash and redirect to reset password form
          window.history.replaceState(null, '', '/reset-password')
          window.location.reload()
        } else if (type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: window.location.hash,
            type: 'email'
          })

          if (error) {
            console.error('Error confirming email:', error)
            setError('Invalid confirmation link')
          } else {
            window.location.replace('/')
          }
        } else {
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError('An error occurred processing the authentication link')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #dc2626',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3>Processing authentication...</h3>
          <p style={{ color: '#6b7280' }}>Please wait while we verify your link.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h3 style={{ color: '#dc2626', marginBottom: '20px' }}>Authentication Error</h3>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Main App Component
export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Simple routing based on URL path and hash
  const path = window.location.pathname
  const hash = window.location.hash
  const hasAuthParams = hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=signup')
  
  // Check if we're in password reset flow
  const isPasswordResetFlow = sessionStorage.getItem('reset_access_token') || 
                              hash.includes('type=recovery') ||
                              path === '/reset-password'

  console.log('Current path:', path)
  console.log('Current hash:', hash)
  console.log('Has auth params:', hasAuthParams)
  console.log('Is password reset flow:', isPasswordResetFlow)

  // Handle auth callback URLs (password reset, email confirmation)
  if (hasAuthParams && !path.includes('/reset-password')) {
    return <AuthCallback />
  }

  // Handle reset password page - show this even if user has session during reset flow
  if (path === '/reset-password' || isPasswordResetFlow) {
    return <ResetPassword />
  }

  // Main app logic
  if (!session) {
    return <Auth />
  }

  return <Dashboard user={session.user} />
}