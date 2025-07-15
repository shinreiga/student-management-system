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
      console.error('Error fetching profile:', error)
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
    // Everyone can see all students, but we'll filter what fields are shown in the UI
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles!students_user_id_fkey (email, role)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching students:', error)
    } else {
      setStudents(data)
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {isAdmin ? '👑' : '🎓'}
              </div>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>
                  Student Directory System
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  {isAdmin ? '👑 Administrator Panel - Full Access' : '👤 User View - Limited Access'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                background: isAdmin ? 'linear-gradient(45deg, #ffd700, #ffed4a)' : 'rgba(255,255,255,0.2)',
                padding: '10px 20px',
                borderRadius: '25px',
                color: isAdmin ? 'black' : 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {isAdmin ? '👑 ADMIN' : '👤 USER'} | {user.email}
              </div>
              <button
                onClick={signOut}
                style={{
                  background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {/* Tab Navigation */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '8px',
            borderRadius: '20px',
            display: 'flex',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {[
              { id: 'students', label: 'All Students', icon: '👥', color: '#4ecdc4' },
              { id: 'table', label: 'Table View', icon: '📊', color: '#45b7d1' },
              ...(isAdmin ? [
                { id: 'add', label: 'Add Student', icon: '➕', color: '#ff6b6b' },
                { id: 'users', label: 'User Management', icon: '👑', color: '#ffd700' }
              ] : []),
              { id: 'raw', label: 'Raw Data', icon: '🔧', color: '#96ceb4' }
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
                  padding: '15px 30px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Student Form (Admin Only) */}
        {activeTab === 'add' && isAdmin && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '30px',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                ✨ Add New Student (Admin Only)
              </h2>
            </div>
            <form onSubmit={createStudent} style={{ padding: '30px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ display: 'block', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                    👤 First Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                    👤 Last Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                    🆔 Student ID
                  </label>
                  <input
                    type="text"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                    🎓 Grade Level
                  </label>
                  <select
                    value={newStudent.grade_level}
                    onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">Select Grade</option>
                    {['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', 
                      '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                    👤 Assign to User
                  </label>
                  <select
                    value={newStudent.assigned_user}
                    onChange={(e) => setNewStudent({ ...newStudent, assigned_user: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                  >
                    {allUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.email} ({user.role})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  color: 'white',
                  border: 'none',
                  padding: '18px 40px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '0 auto'
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
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                👥 All Students ({students.length})
                {!isAdmin && (
                  <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                    ℹ️ Limited view: Name and Student ID only
                  </div>
                )}
              </h2>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {students.map((student, index) => {
                const displayData = getStudentDisplayData(student)
                const canEditThis = canEdit(student.user_id)
                
                return (
                  <div key={student.id} style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: `linear-gradient(45deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][index % 4]}, ${['#ff7675', '#55efc4', '#74b9ff', '#a8e6cf'][index % 4]})`,
                      padding: '20px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                            {displayData.first_name} {displayData.last_name}
                          </h3>
                          {isAdmin && (
                            <>
                              <p style={{ margin: '5px 0', opacity: 0.9 }}>{student.email}</p>
                              {student.profiles && (
                                <p style={{ margin: '5px 0', opacity: 0.8, fontSize: '14px' }}>
                                  Managed by: {student.profiles.email}
                                </p>
                              )}
                            </>
                          )}
                          {!isAdmin && (
                            <p style={{ margin: '5px 0', opacity: 0.9, fontSize: '14px' }}>
                              👁️ Limited view - contact admin for full details
                            </p>
                          )}
                        </div>
                        {canEditThis && (
                          <button
                            onClick={() => deleteStudent(student.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '20px', color: 'white' }}>
                      {displayData.student_id && (
                        <p style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                          <span>🆔</span> ID: {displayData.student_id}
                        </p>
                      )}
                      {isAdmin && (
                        <>
                          {student.grade_level && <p>🎓 Grade: {student.grade_level}</p>}
                          <p>📅 Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</p>
                        </>
                      )}
                      {!isAdmin && !displayData.student_id && (
                        <p style={{ opacity: 0.7, fontSize: '14px' }}>
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

        {/* Table View */}
        {activeTab === 'table' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '25px',
              textAlign: 'center'
            }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
                📊 Students Table ({students.length})
                {!isAdmin && (
                  <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                    Limited view for regular users
                  </div>
                )}
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>First Name</th>
                    <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Last Name</th>
                    <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Student ID</th>
                    {isAdmin && (
                      <>
                        <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Grade</th>
                        <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Enrolled</th>
                        <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Managed By</th>
                        <th style={{ padding: '15px', color: 'white', textAlign: 'left' }}>Actions</th>
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
                        <td style={{ padding: '15px', color: 'white' }}>{displayData.first_name}</td>
                        <td style={{ padding: '15px', color: 'white' }}>{displayData.last_name}</td>
                        <td style={{ padding: '15px', color: 'white' }}>{displayData.student_id || '—'}</td>
                        {isAdmin && (
                          <>
                            <td style={{ padding: '15px', color: 'white' }}>{student.email}</td>
                            <td style={{ padding: '15px', color: 'white' }}>{student.grade_level || '—'}</td>
                            <td style={{ padding: '15px', color: 'white' }}>
                              {new Date(student.enrollment_date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '15px', color: 'white' }}>
                              {student.profiles?.email || 'Unknown'}
                            </td>
                            <td style={{ padding: '15px' }}>
                              {canEditThis && (
                                <button
                                  onClick={() => deleteStudent(student.id)}
                                  style={{
                                    background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 15px',
                                    borderRadius: '20px',
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
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '30px'
          }}>
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '20px' }}>
              👑 User Management (Admin Only)
            </h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {allUsers.map(user => (
                <div key={user.id} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '20px',
                  borderRadius: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: 'white' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{user.email}</h3>
                    <p style={{ margin: '5px 0', opacity: 0.8 }}>
                      Role: {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                      style={{
                        background: user.role === 'admin' ? 'linear-gradient(45deg, #ff4757, #ff3742)' : 'linear-gradient(45deg, #ffd700, #ffed4a)',
                        color: user.role === 'admin' ? 'white' : 'black',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </div>
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
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '30px'
          }}>
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '20px' }}>
              🔧 Raw Data {!isAdmin && '(Limited View)'}
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>Your Profile:</h3>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#00ff00',
                  padding: '20px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(userProfile, null, 2)}
                </pre>
              </div>
              <div>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>
                  Students Data {!isAdmin && '(Filtered)'}:
                </h3>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#00ff00',
                  padding: '20px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  overflow: 'auto',
                  maxHeight: '400px'
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
              {isAdmin && (
                <div>
                  <h3 style={{ color: 'white', marginBottom: '10px' }}>All Users (Admin Only):</h3>
                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#00ff00',
                    padding: '20px',
                    borderRadius: '15px',
                    fontSize: '14px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(allUsers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}