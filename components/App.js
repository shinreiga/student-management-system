import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Dashboard from './Dashboard'
import Auth from './Auth'

// Reset Password Component
function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasValidTokens, setHasValidTokens] = useState(false)
  const [resetTokens, setResetTokens] = useState(null)

  useEffect(() => {
    // Check if there are reset tokens in the URL hash
    const hash = window.location.hash.substring(1)
    console.log('ResetPassword: Checking hash:', hash)
    
    const hashParams = new URLSearchParams(hash)
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')
    
    console.log('ResetPassword: Found tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type })
    
    if (type === 'recovery' && accessToken && refreshToken) {
      console.log('ResetPassword: Valid recovery tokens found')
      setHasValidTokens(true)
      setResetTokens({ accessToken, refreshToken })
      
      // Set the session immediately to avoid token expiry
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data, error }) => {
        if (error) {
          console.error('ResetPassword: Error setting session:', error)
          setHasValidTokens(false)
        } else {
          console.log('ResetPassword: Session set successfully')
        }
      })
      
      // Clear the hash from URL
      window.history.replaceState(null, '', '/reset-password')
    } else {
      console.log('ResetPassword: No valid tokens found')
    }
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

    if (!resetTokens) {
      alert('Invalid reset session. Please request a new password reset.')
      return
    }

    setLoading(true)

    try {
      console.log('ResetPassword: Updating password')
      // The session should already be set from useEffect
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      alert('Password updated successfully!')
      window.location.href = '/'
    } catch (error) {
      console.error('Password update error:', error)
      alert('Error updating password: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!hasValidTokens) {
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
          🔒 Reset Your Password
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
              placeholder="Enter your new password"
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
              placeholder="Confirm your new password"
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
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel
          </button>
        </div>
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
          // Just redirect to reset password page with the tokens in the URL
          window.location.href = `/reset-password#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`
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
  const hasSignupParams = hash.includes('type=signup')
  const hasRecoveryParams = hash.includes('type=recovery')

  console.log('Current path:', path)
  console.log('Current hash:', hash)
  console.log('Has signup params:', hasSignupParams)
  console.log('Has recovery params:', hasRecoveryParams)
  console.log('Session exists:', !!session)

  // PRIORITY 1: Handle password recovery - ALWAYS show reset form for recovery tokens
  if (hasRecoveryParams) {
    console.log('Showing ResetPassword component due to recovery params')
    return <ResetPassword />
  }

  // PRIORITY 2: Handle auth callback path
  if (path === '/auth/callback') {
    if (hasSignupParams) {
      return <AuthCallback />
    } else {
      // If no specific params, redirect to home
      window.location.href = '/'
      return null
    }
  }

  // PRIORITY 3: Handle signup confirmations
  if (hasSignupParams) {
    return <AuthCallback />
  }

  // PRIORITY 4: Handle reset password page
  if (path === '/reset-password') {
    return <ResetPassword />
  }

  // PRIORITY 5: Main app logic
  if (!session) {
    return <Auth />
  }

  return <Dashboard user={session.user} />
}
