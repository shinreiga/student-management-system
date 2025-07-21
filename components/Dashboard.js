import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'

// Your existing Dashboard component goes here (copy from your Dashboard.js file)
function Dashboard({ user }) {
  const [students, setStudents] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    student_id: '',
    grade_level: ''
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('students')

  useEffect(() => {
    fetchUserProfile()
    fetchStudents()
  }, [])

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ id: user.id, email: user.email, role: 'user' }])
        .select()
        .single()
      
      if (!createError) {
        setUserProfile(newProfile)
      }
    } else {
      setUserProfile(data)
    }
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setStudents(data || [])
    }
  }

  const createStudent = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          first_name: newStudent.first_name,
          last_name: newStudent.last_name,
          email: newStudent.email,
          student_id: newStudent.student_id || null,
          grade_level: newStudent.grade_level || null,
          user_id: user.id
        }
      ])

    if (error) {
      alert('Error creating student: ' + error.message)
    } else {
      setNewStudent({
        first_name: '',
        last_name: '',
        email: '',
        student_id: '',
        grade_level: ''
      })
      fetchStudents()
    }
    setLoading(false)
  }

  const deleteStudent = async (studentId) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (!error) {
        fetchStudents()
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        alert('Error signing out: ' + error.message)
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }

  const isAdmin = userProfile?.role === 'admin'
  const canEdit = (studentUserId) => isAdmin || studentUserId === user.id

  const getStudentDisplayData = (student) => {
    if (isAdmin) {
      return student
    } else {
      return {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_id: student.student_id,
        user_id: student.user_id
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '3px solid #dc2626',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px', 
              color: '#1f2937',
              fontWeight: 'bold'
            }}>
              🥋 National Taekwondo Club
            </h1>
            <p style={{ 
              margin: '5px 0 0 0', 
              color: '#6b7280' 
            }}>
              {isAdmin ? 'Instructor Panel' : 'Member Portal'} | {students.length} members
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{
              background: isAdmin ? '#dc2626' : '#374151',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {isAdmin ? 'INSTRUCTOR' : 'MEMBER'}
            </span>
            <button 
              onClick={signOut}
              style={{
                background: '#374151',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Tab Navigation */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '8px'
          }}>
            {[
              { id: 'students', label: 'Members', icon: '👥' },
              { id: 'table', label: 'Table View', icon: '📋' },
              ...(isAdmin ? [{ id: 'add', label: 'Add Member', icon: '➕' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? '#dc2626' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#374151',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Student Form (Admin Only) */}
        {activeTab === 'add' && isAdmin && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0',
              fontSize: '24px',
              color: '#1f2937'
            }}>
              Add New Club Member
            </h2>
            <form onSubmit={createStudent}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Belt Level
                  </label>
                  <select
                    value={newStudent.grade_level}
                    onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Belt Level</option>
                    <option value="White Belt">White Belt</option>
                    <option value="Yellow Belt">Yellow Belt</option>
                    <option value="Green Belt">Green Belt</option>
                    <option value="Blue Belt">Blue Belt</option>
                    <option value="Red Belt">Red Belt</option>
                    <option value="Black Belt">Black Belt</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>
        )}

        {/* Members Grid View */}
        {activeTab === 'students' && (
          <div>
            <h2 style={{ 
              margin: '0 0 20px 0',
              fontSize: '24px',
              color: '#1f2937'
            }}>
              Club Members ({students.length})
              {!isAdmin && (
                <span style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  fontWeight: 'normal',
                  marginLeft: '10px'
                }}>
                  - Limited View
                </span>
              )}
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {students.map((student, index) => {
                const displayData = getStudentDisplayData(student)
                const canEditThis = canEdit(student.user_id)
                
                return (
                  <div key={student.id} style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: `3px solid ${index % 2 === 0 ? '#dc2626' : '#374151'}`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '15px'
                    }}>
                      <div>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '18px',
                          color: '#1f2937',
                          fontWeight: 'bold'
                        }}>
                          {displayData.first_name} {displayData.last_name}
                        </h3>
                        {isAdmin && (
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>
                            📧 {student.email}
                          </p>
                        )}
                        {!isAdmin && (
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            Contact instructor for details
                          </p>
                        )}
                      </div>
                      {canEditThis && (
                        <button
                          onClick={() => deleteStudent(student.id)}
                          style={{
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div>
                      {displayData.student_id && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          🆔 ID: {displayData.student_id}
                        </p>
                      )}
                      {isAdmin && student.grade_level && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#059669',
                          fontWeight: 'bold'
                        }}>
                          🥋 {student.grade_level}
                        </p>
                      )}
                      {isAdmin && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '13px',
                          color: '#6b7280'
                        }}>
                          📅 Joined: {new Date(student.enrollment_date).toLocaleDateString()}
                        </p>
                      )}
                      {!isAdmin && !displayData.student_id && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '13px',
                          color: '#9ca3af',
                          fontStyle: 'italic'
                        }}>
                          Limited information available
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {students.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🥋</div>
                <h3 style={{ color: '#374151' }}>No members found</h3>
                <p style={{ color: '#6b7280' }}>
                  {isAdmin ? 'Add the first club member using the "Add Member" tab.' : 'Check back later for club members.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Table View */}
        {activeTab === 'table' && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#374151',
              color: 'white',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>
                📋 Members List ({students.length})
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Student ID</th>
                    {isAdmin && (
                      <>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Belt Level</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const displayData = getStudentDisplayData(student)
                    const canEditThis = canEdit(student.user_id)
                    
                    return (
                      <tr key={student.id} style={{
                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>
                          {displayData.first_name} {displayData.last_name}
                        </td>
                        <td style={{ padding: '15px' }}>
                          {displayData.student_id || '—'}
                        </td>
                        {isAdmin && (
                          <>
                            <td style={{ padding: '15px' }}>{student.email}</td>
                            <td style={{ padding: '15px' }}>{student.grade_level || '—'}</td>
                            <td style={{ padding: '15px' }}>
                              {canEditThis && (
                                <button
                                  onClick={() => deleteStudent(student.id)}
                                  style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Reset Password Component
function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

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

  // Simple routing based on URL path
  const path = window.location.pathname
  const hasAuthParams = window.location.hash.includes('access_token')

  // Handle auth callback URLs (password reset, email confirmation)
  if (hasAuthParams || path === '/auth/callback') {
    return <AuthCallback />
  }

  // Handle reset password page
  if (path === '/reset-password') {
    return <ResetPassword />
  }

  // Main app logic
  if (!session) {
    return <Auth />
  }

  return <Dashboard user={session.user} />
}'
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
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Error setting session:', error)
            setError('Invalid or expired reset link')
          } else {
            console.log('Session set successfully:', data)
            window.location.href = '/reset-password'
          }
        } else if (type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: window.location.hash,
            type: 'email'
          })

          if (error) {
            console.error('Error confirming email:', error)
            setError('Invalid confirmation link')
          } else {
            window.location.href = '/'
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
              cursor: 'pointer