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
      // Create profile if it doesn't exist
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
  console.log('🔍 Fetching students...')
  
  try {
    // Simple query without joins first
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📊 Query result:', { data, error })
    console.log('📝 Number of students found:', data?.length || 0)
    
    if (error) {
      console.error('❌ Error:', error)
      alert('Error: ' + error.message)
      setStudents([])
    } else {
      console.log('✅ Success! Students:', data)
      setStudents(data || [])
    }
  } catch (err) {
    console.error('💥 Exception:', err)
    setStudents([])
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

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = userProfile?.role === 'admin'
  const canEdit = (studentUserId) => isAdmin || studentUserId === user.id

  // Function to filter student data based on user role
  const getStudentDisplayData = (student) => {
    if (isAdmin) {
      // Admins see everything
      return student
    } else {
      // Regular users see limited fields
      return {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_id: student.student_id,
        user_id: student.user_id,
        profiles: student.profiles
      }
    }
  }

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 50
  }

  const tabContainerStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    padding: '4px',
    borderRadius: '20px',
    display: 'flex',
    gap: '4px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }

  return (
    <div style={containerStyle}>
      {/* Mobile-Friendly Header */}
      <div style={headerStyle}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '15px 20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              minWidth: '200px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {isAdmin ? '👑' : '🎓'}
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(18px, 4vw, 28px)',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  lineHeight: '1.2'
                }}>
                  Student Directory
                </h1>
                <p style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  margin: 0,
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  {isAdmin ? '👑 Admin' : '👤 User'} | {students.length} students
                </p>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: isAdmin ? 'linear-gradient(45deg, #ffd700, #ffed4a)' : 'rgba(255,255,255,0.2)',
                padding: '8px 15px',
                borderRadius: '20px',
                color: isAdmin ? 'black' : 'white',
                fontSize: 'clamp(11px, 2vw, 13px)',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                {user.email.split('@')[0]}
              </div>
              <button
                onClick={signOut}
                style={{
                  background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px'
      }}>
        {/* Mobile-Friendly Tab Navigation */}
        <div style={{ marginBottom: '20px' }}>
          <div style={tabContainerStyle}>
            {[
              { id: 'students', label: 'Students', icon: '👥', color: '#4ecdc4' },
              { id: 'table', label: 'Table', icon: '📊', color: '#45b7d1' },
              ...(isAdmin ? [
                { id: 'add', label: 'Add', icon: '➕', color: '#ff6b6b' },
                { id: 'users', label: 'Users', icon: '👑', color: '#ffd700' }
              ] : []),
              { id: 'raw', label: 'Data', icon: '🔧', color: '#96ceb4' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id 
                    ? `linear-gradient(45deg, ${tab.color}, ${tab.color}dd)` 
                    : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.8)',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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

        {/* Debug Info */}
        {students.length === 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '20px',
            textAlign: 'center',
            color: 'white'
          }}>
            <h3>🔍 No Students Found</h3>
            <p>This could mean:</p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <li>No students have been added yet</li>
              <li>Database connection issue</li>
              <li>Permission problem</li>
            </ul>
            <p style={{ marginTop: '15px', fontSize: '14px', opacity: 0.8 }}>
              User Profile: {userProfile ? `${userProfile.email} (${userProfile.role})` : 'Loading...'}
            </p>
          </div>
        )}

        {/* Add Student Form (Admin Only) */}
        {activeTab === 'add' && isAdmin && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: 'clamp(20px, 4vw, 24px)',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                ✨ Add New Student
              </h2>
            </div>
            <form onSubmit={createStudent} style={{ padding: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    👤 First Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    👤 Last Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    🆔 Student ID
                  </label>
                  <input
                    type="text"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    🎓 Grade Level
                  </label>
                  <select
                    value={newStudent.grade_level}
                    onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select Grade</option>
                    {['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', 
                      '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                {allUsers.length > 0 && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'white', 
                      fontWeight: 'bold', 
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      👤 Assign to User
                    </label>
                    <select
                      value={newStudent.assigned_user}
                      onChange={(e) => setNewStudent({ ...newStudent, assigned_user: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.email} ({user.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '0 auto',
                  width: '100%',
                  maxWidth: '200px',
                  justifyContent: 'center'
                }}
              >
                {loading ? 'Adding...' : '⚡ Add Student'}
              </button>
            </form>
          </div>
        )}

        {/* All Students View */}
        {activeTab === 'students' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h2 style={{
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                margin: 0
              }}>
                👥 All Students ({students.length})
              </h2>
              {!isAdmin && (
                <div style={{ 
                  fontSize: 'clamp(11px, 2vw, 13px)', 
                  opacity: 0.8,
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '15px'
                }}>
                  ℹ️ Limited view
                </div>
              )}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '15px'
            }}>
              {students.map((student, index) => {
                const displayData = getStudentDisplayData(student)
                const canEditThis = canEdit(student.user_id)
                
                return (
                  <div key={student.id} style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{
                      background: `linear-gradient(45deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][index % 4]}, ${['#ff7675', '#55efc4', '#74b9ff', '#a8e6cf'][index % 4]})`,
                      padding: '15px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: 'clamp(16px, 3vw, 18px)', 
                            fontWeight: 'bold',
                            lineHeight: '1.2'
                          }}>
                            {displayData.first_name} {displayData.last_name}
                          </h3>
                          {isAdmin && (
                            <>
                              <p style={{ 
                                margin: '5px 0', 
                                opacity: 0.9,
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                wordBreak: 'break-word'
                              }}>
                                {student.email}
                              </p>
                              {student.profiles && (
                                <p style={{ 
                                  margin: '5px 0', 
                                  opacity: 0.8, 
                                  fontSize: 'clamp(11px, 2vw, 12px)'
                                }}>
                                  Managed by: {student.profiles.email}
                                </p>
                              )}
                            </>
                          )}
                          {!isAdmin && (
                            <p style={{ 
                              margin: '5px 0', 
                              opacity: 0.9, 
                              fontSize: 'clamp(11px, 2vw, 12px)'
                            }}>
                              👁️ Limited view
                            </p>
                          )}
                        </div>
                        {canEditThis && (
                          <button
                            onClick={() => deleteStudent(student.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              marginLeft: '10px'
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '15px', color: 'white' }}>
                      {displayData.student_id && (
                        <p style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          margin: '8px 0',
                          fontSize: 'clamp(12px, 2.5vw, 14px)'
                        }}>
                          <span>🆔</span> ID: {displayData.student_id}
                        </p>
                      )}
                      {isAdmin && (
                        <>
                          {student.grade_level && (
                            <p style={{ 
                              margin: '8px 0',
                              fontSize: 'clamp(12px, 2.5vw, 14px)'
                            }}>
                              🎓 Grade: {student.grade_level}
                            </p>
                          )}
                          <p style={{ 
                            margin: '8px 0',
                            fontSize: 'clamp(12px, 2.5vw, 14px)'
                          }}>
                            📅 Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                          </p>
                        </>
                      )}
                      {!isAdmin && !displayData.student_id && (
                        <p style={{ 
                          opacity: 0.7, 
                          fontSize: 'clamp(11px, 2vw, 12px)',
                          fontStyle: 'italic'
                        }}>
                          No additional details available
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mobile-Friendly Table View */}
        {activeTab === 'table' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                color: 'white', 
                margin: 0, 
                fontSize: 'clamp(18px, 4vw, 22px)'
              }}>
                📊 Students Table ({students.length})
              </h2>
              {!isAdmin && (
                <div style={{ 
                  fontSize: 'clamp(11px, 2vw, 13px)', 
                  opacity: 0.8, 
                  marginTop: '5px',
                  color: 'white'
                }}>
                  Limited view for regular users
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '100px' }}>
                      First Name
                    </th>
                    <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '100px' }}>
                      Last Name
                    </th>
                    <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '100px' }}>
                      Student ID
                    </th>
                    {isAdmin && (
                      <>
                        <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '150px' }}>
                          Email
                        </th>
                        <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '100px' }}>
                          Grade
                        </th>
                        <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '100px' }}>
                          Enrolled
                        </th>
                        <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '120px' }}>
                          Managed By
                        </th>
                        <th style={{ padding: '12px 8px', color: 'white', textAlign: 'left', fontSize: '14px', minWidth: '80px' }}>
                          Actions
                        </th>
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
                        background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'
                      }}>
                        <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px' }}>
                          {displayData.first_name}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px' }}>
                          {displayData.last_name}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px' }}>
                          {displayData.student_id || '—'}
                        </td>
                        {isAdmin && (
                          <>
                            <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px', wordBreak: 'break-word' }}>
                              {student.email}
                            </td>
                            <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px' }}>
                              {student.grade_level || '—'}
                            </td>
                            <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px' }}>
                              {new Date(student.enrollment_date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px 8px', color: 'white', fontSize: '14px', wordBreak: 'break-word' }}>
                              {student.profiles?.email || 'Unknown'}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {canEditThis && (
                                <button
                                  onClick={() => deleteStudent(student.id)}
                                  style={{
                                    background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '15px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Delete
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

        {/* User Management (Admin Only) */}
        {activeTab === 'users' && isAdmin && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '20px'
          }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: 'clamp(18px, 4vw, 22px)', 
              marginBottom: '20px' 
            }}>
              👑 User Management
            </h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {allUsers.map(user => (
                <div key={user.id} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '15px',
                  borderRadius: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ color: 'white', flex: '1', minWidth: '200px' }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      wordBreak: 'break-word'
                    }}>
                      {user.email}
                    </h3>
                    <p style={{ 
                      margin: '5px 0', 
                      opacity: 0.8,
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>
                      Role: {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </p>
                  </div>
                  <button
                    onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                    style={{
                      background: user.role === 'admin' 
                        ? 'linear-gradient(45deg, #ff4757, #ff3742)' 
                        : 'linear-gradient(45deg, #ffd700, #ffed4a)',
                      color: user.role === 'admin' ? 'white' : 'black',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontSize: 'clamp(11px, 2vw, 13px)',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Data */}
        {activeTab === 'raw' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '20px'
          }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: 'clamp(18px, 4vw, 22px)', 
              marginBottom: '20px' 
            }}>
              🔧 Raw Data {!isAdmin && '(Limited)'}
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <h3 style={{ 
                  color: 'white', 
                  marginBottom: '10px',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  Your Profile:
                </h3>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#00ff00',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: 'clamp(10px, 2vw, 12px)',
                  overflow: 'auto',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(userProfile, null, 2)}
                </pre>
              </div>
              <div>
                <h3 style={{ 
                  color: 'white', 
                  marginBottom: '10px',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  Students Data {!isAdmin && '(Filtered)'}:
                </h3>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#00ff00',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: 'clamp(10px, 2vw, 12px)',
                  overflow: 'auto',
                  maxHeight: '300px',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(
                    isAdmin 
                      ? students 
                      : students.map(getStudentDisplayData), 
                    null, 
                    2
                  )}
                </pre>
              </div>
              {isAdmin && allUsers.length > 0 && (
                <div>
                  <h3 style={{ 
                    color: 'white', 
                    marginBottom: '10px',
                    fontSize: 'clamp(14px, 3vw, 16px)'
                  }}>
                    All Users (Admin Only):
                  </h3>
                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#00ff00',
                    padding: '15px',
                    borderRadius: '10px',
                    fontSize: 'clamp(10px, 2vw, 12px)',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(allUsers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .tab-label {
            display: none;
          }
        }
        
        /* Hide scrollbar for tab container */
        div::-webkit-scrollbar {
          display: none;
        }
        
        /* Ensure inputs work well on mobile */
        input, select, textarea {
          -webkit-appearance: none;
          appearance: none;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #4ecdc4 !important;
          box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.3) !important;
        }
      `}</style>
    </div>
  )
}