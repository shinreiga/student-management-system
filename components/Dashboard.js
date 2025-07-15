import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
  const [students, setStudents] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    student_id: '',
    grade_level: '',
    assigned_user: user.id
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
      if (data.role === 'admin') {
        fetchAllUsers()
      }
    }
  }

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email')

    if (!error) {
      setAllUsers(data)
    }
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        email,
        student_id,
        grade_level,
        enrollment_date,
        user_id,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching students:', error)
    } else {
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
          user_id: newStudent.assigned_user
        }
      ])

    if (error) {
      console.error('Error creating student:', error)
      alert('Error creating student: ' + error.message)
    } else {
      setNewStudent({
        first_name: '',
        last_name: '',
        email: '',
        student_id: '',
        grade_level: '',
        assigned_user: user.id
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

      if (error) {
        console.error('Error deleting student:', error)
        alert('Error deleting student: ' + error.message)
      } else {
        fetchStudents()
      }
    }
  }

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('Error updating role:', error)
      alert('Error updating role: ' + error.message)
    } else {
      fetchAllUsers()
      alert('Role updated successfully!')
    }
  }

  // Fixed sign out function
  const signOut = async () => {
    try {
      console.log('Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        alert('Error signing out: ' + error.message)
      } else {
        console.log('Signed out successfully')
        // Force page reload to ensure complete logout
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Sign out exception:', err)
      // Force page reload as fallback
      window.location.href = '/'
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
      fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif"
    }}>
      {/* Header Navigation */}
      <header style={{
        background: '#ffffff',
        borderBottom: '3px solid #dc2626',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '80px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}>
                🥋
              </div>
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0,
                  lineHeight: '1.2'
                }}>
                  National Taekwondo Club
                </h1>
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  Student Management System
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                background: isAdmin ? '#dc2626' : '#374151',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {isAdmin ? '👑' : '👤'} {isAdmin ? 'INSTRUCTOR' : 'MEMBER'}
              </div>
              {/* Fixed Sign Out Button */}
              <button
                onClick={signOut}
                style={{
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: '700',
            margin: '0 0 20px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Club Members Directory
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 3vw, 20px)',
            margin: '0 0 30px 0',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 30px auto'
          }}>
            {isAdmin 
              ? `Managing ${students.length} club members. Welcome back, Instructor!`
              : `Viewing ${students.length} club members. ${!isAdmin ? 'Limited member information available.' : ''}`
            }
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              minWidth: '150px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{students.length}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Members</div>
            </div>
            {isAdmin && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center',
                minWidth: '150px'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{allUsers.length}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>System Users</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            border: '1px solid #e5e7eb'
          }}>
            {[
              { id: 'students', label: 'Members', icon: '👥', color: '#dc2626' },
              { id: 'table', label: 'List View', icon: '📋', color: '#059669' },
              ...(isAdmin ? [
                { id: 'add', label: 'Add Member', icon: '➕', color: '#dc2626' },
                { id: 'users', label: 'User Management', icon: '⚙️', color: '#7c3aed' }
              ] : []),
              { id: 'raw', label: 'Data Export', icon: '📊', color: '#0891b2' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? tab.color : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#374151',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Member Form (Admin Only) */}
        {activeTab === 'add' && isAdmin && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: 'white',
              padding: '30px',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 10px 0'
              }}>
                Add New Club Member
              </h3>
              <p style={{
                margin: 0,
                opacity: 0.9,
                fontSize: '16px'
              }}>
                Register a new student in the Taekwondo club
              </p>
            </div>
            <form onSubmit={createStudent} style={{ padding: '30px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'First Name', field: 'first_name', placeholder: 'Enter first name', required: true },
                  { label: 'Last Name', field: 'last_name', placeholder: 'Enter last name', required: true },
                  { label: 'Email Address', field: 'email', placeholder: 'student@example.com', type: 'email', required: true },
                  { label: 'Student ID', field: 'student_id', placeholder: 'Optional student ID' },
                ].map((field) => (
                  <div key={field.field}>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontWeight: '600',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={newStudent[field.field]}
                      onChange={(e) => setNewStudent({ ...newStudent, [field.field]: e.target.value })}
                      placeholder={field.placeholder}
                      required={field.required}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#374151',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Belt Level / Grade
                  </label>
                  <select
                    value={newStudent.grade_level}
                    onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      background: '#f9fafb',
                      color: '#374151',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Belt Level</option>
                    <option value="White Belt">White Belt (10th Kup)</option>
                    <option value="Yellow Tag">Yellow Tag (9th Kup)</option>
                    <option value="Yellow Belt">Yellow Belt (8th Kup)</option>
                    <option value="Green Tag">Green Tag (7th Kup)</option>
                    <option value="Green Belt">Green Belt (6th Kup)</option>
                    <option value="Blue Tag">Blue Tag (5th Kup)</option>
                    <option value="Blue Belt">Blue Belt (4th Kup)</option>
                    <option value="Red Tag">Red Tag (3rd Kup)</option>
                    <option value="Red Belt">Red Belt (2nd Kup)</option>
                    <option value="Black Tag">Black Tag (1st Kup)</option>
                    <option value="Black Belt 1st Dan">Black Belt 1st Dan</option>
                    <option value="Black Belt 2nd Dan">Black Belt 2nd Dan</option>
                    <option value="Black Belt 3rd Dan">Black Belt 3rd Dan</option>
                  </select>
                </div>
                {allUsers.length > 0 && (
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontWeight: '600',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      Assign to Instructor
                    </label>
                    <select
                      value={newStudent.assigned_user}
                      onChange={(e) => setNewStudent({ ...newStudent, assigned_user: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#374151',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.email} ({user.role === 'admin' ? 'Instructor' : 'Member'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  {loading ? 'Adding Member...' : '🥋 Add Club Member'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members Grid View */}
        {activeTab === 'students' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <h3 style={{
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Club Members ({students.length})
              </h3>
              {!isAdmin && (
                <div style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1px solid #f59e0b'
                }}>
                  ℹ️ Limited Member View
                </div>
              )}
            </div>
            
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
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      background: index % 2 === 0 
                        ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                        : 'linear-gradient(135deg, #374151, #1f2937)',
                      color: 'white',
                      padding: '20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            fontSize: '18px',
                            fontWeight: '700'
                          }}>
                            {displayData.first_name} {displayData.last_name}
                          </h4>
                          {isAdmin && (
                            <>
                              <p style={{
                                margin: '0 0 8px 0',
                                opacity: 0.9,
                                fontSize: '14px'
                              }}>
                                📧 {student.email}
                              </p>
                              {student.grade_level && (
                                <div style={{
                                  background: 'rgba(255, 255, 255, 0.2)',
                                  padding: '4px 12px',
                                  borderRadius: '15px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  display: 'inline-block'
                                }}>
                                  🥋 {student.grade_level}
                                </div>
                              )}
                            </>
                          )}
                          {!isAdmin && (
                            <p style={{
                              margin: 0,
                              opacity: 0.8,
                              fontSize: '12px'
                            }}>
                              Contact instructor for full details
                            </p>
                          )}
                        </div>
                        {canEditThis && (
                          <button
                            onClick={() => deleteStudent(student.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: 'white',
                              marginLeft: '15px'
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '20px', color: '#374151' }}>
                      {displayData.student_id && (
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ 
                            background: '#f3f4f6', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '12px'
                          }}>
                            ID: {displayData.student_id}
                          </span>
                        </p>
                      )}
                      {isAdmin && (
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#6b7280'
                        }}>
                          📅 Joined: {new Date(student.enrollment_date).toLocaleDateString()}
                        </p>
                      )}
                      {!isAdmin && !displayData.student_id && (
                        <p style={{
                          margin: 0,
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
          </div>
        )}

        {/* Table View */}
        {activeTab === 'table' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #374151, #1f2937)',
              color: 'white',
              padding: '25px',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                margin: '0 0 10px 0'
              }}>
                📋 Members List ({students.length})
              </h3>
              {!isAdmin && (
                <p style={{
                  margin: 0,
                  opacity: 0.8,
                  fontSize: '14px'
                }}>
                  Showing limited member information
                </p>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                      First Name
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                      Last Name
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                      Student ID
                    </th>
                    {isAdmin && (
                      <>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                          Email
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                          Belt Level
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                          Joined
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                          Actions
                        </th>
                      </>
                    )}
                  </tr>