import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
  const [students, setStudents] = useState([])
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
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
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
          user_id: user.id
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

      if (error) {
        console.error('Error deleting student:', error)
        alert('Error deleting student: ' + error.message)
      } else {
        fetchStudents()
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* ULTRA MODERN ANIMATED HEADER */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        animation: 'slideDown 0.5s ease-out'
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
                fontSize: '24px',
                animation: 'pulse 2s infinite'
              }}>
                🚀
              </div>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>
                  ULTRA 221 MODERN Student Portal
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  Next-Generation Management System ✨
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '10px 20px',
                borderRadius: '25px',
                color: 'white',
                fontSize: '14px'
              }}>
                👤 {user.email}
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
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 16px rgba(255,71,87,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 12px 24px rgba(255,71,87,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 8px 16px rgba(255,71,87,0.3)'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        {/* FUTURISTIC TAB NAVIGATION */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '8px',
            borderRadius: '20px',
            display: 'flex',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            {[
              { id: 'students', label: 'Students', icon: '👥', color: '#4ecdc4' },
              { id: 'table', label: 'Table View', icon: '📊', color: '#45b7d1' },
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
                  gap: '10px',
                  transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: activeTab === tab.id ? `0 8px 16px ${tab.color}44` : 'none'
                }}
              >
                <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* SPECTACULAR ADD STUDENT FORM */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)'
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
                margin: 0,
                textShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}>
                ✨ Add New Student ✨
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '10px 0 0 0' }}>
                Register a new student in the system
              </p>
            </div>
            <form onSubmit={createStudent} style={{ padding: '30px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'First Name', field: 'first_name', placeholder: 'Enter first name', icon: '👤' },
                  { label: 'Last Name', field: 'last_name', placeholder: 'Enter last name', icon: '👤' },
                  { label: 'Email', field: 'email', placeholder: 'student@example.com', icon: '📧', type: 'email' },
                  { label: 'Student ID', field: 'student_id', placeholder: 'Optional ID', icon: '🆔' }
                ].map((field) => (
                  <div key={field.field}>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      {field.icon} {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={newStudent[field.field]}
                      onChange={(e) => setNewStudent({ ...newStudent, [field.field]: e.target.value })}
                      placeholder={field.placeholder}
                      required={field.field !== 'student_id'}
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '15px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '16px',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4ecdc4'
                        e.target.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
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
                      padding: '15px',
                      borderRadius: '15px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <option value="" style={{ background: '#333', color: 'white' }}>Select Grade Level</option>
                    {['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', 
                      '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map(grade => (
                      <option key={grade} value={grade} style={{ background: '#333', color: 'white' }}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#666' : 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  color: 'white',
                  border: 'none',
                  padding: '18px 40px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-3px)'
                    e.target.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Adding Student...
                  </>
                ) : (
                  <>
                    ⚡ Add Student
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* STUDENTS DISPLAY */}
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
                👥 Students ({students.length})
              </h2>
            </div>
            
            {students.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>📚</div>
                <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>
                  No students registered yet
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                  Add your first student using the form above!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      animation: `slideUp 0.5s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-5px)'
                      e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      background: `linear-gradient(45deg, ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][index % 5]}, ${['#ff7675', '#55efc4', '#74b9ff', '#a8e6cf', '#fdcb6e'][index % 5]})`,
                      padding: '20px',
                      color: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                            {student.first_name} {student.last_name}
                          </h3>
                          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>{student.email}</p>
                        </div>
                        <button
                          onClick={() => deleteStudent(student.id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 0, 0, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      {student.student_id && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px',
                          color: 'white'
                        }}>
                          <span style={{ fontSize: '18px' }}>🆔</span>
                          <span>ID: {student.student_id}</span>
                        </div>
                      )}
                      {student.grade_level && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px',
                          color: 'white'
                        }}>
                          <span style={{ fontSize: '18px' }}>🎓</span>
                          <span>Grade: {student.grade_level}</span>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'white'
                      }}>
                        <span style={{ fontSize: '18px' }}>📅</span>
                        <span>Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABLE VIEW */}
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
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                📊 Students Database Table
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '10px 0 0 0' }}>
                {students.length} students registered
              </p>
            </div>
            
            {students.length === 0 ? (
              <div style={{
                padding: '60px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>📋</div>
                <p style={{ fontSize: '18px' }}>No records in database yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                      {['ID', 'Name', 'Email', 'Student ID', 'Grade', 'Enrolled', 'Actions'].map((header) => (
                        <th key={header} style={{
                          padding: '15px',
                          textAlign: 'left',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} style={{
                        background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                        transition: 'background 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(78, 205, 196, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'
                      }}>
                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontFamily: 'monospace' }}>
                          {student.id.slice(0, 8)}...
                        </td>
                        <td style={{ padding: '15px', color: 'white', fontWeight: 'bold' }}>
                          {student.first_name} {student.last_name}
                        </td>
                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.9)' }}>
                          {student.email}
                        </td>
                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.9)' }}>
                          {student.student_id || '—'}
                        </td>
                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.9)' }}>
                          {student.grade_level || '—'}
                        </td>
                        <td style={{ padding: '15px', color: 'rgba(255,255,255,0.9)' }}>
                          {new Date(student.enrollment_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <button
                            onClick={() => deleteStudent(student.id)}
                            style={{
                              background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 15px',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RAW DATA VIEW */}
        {activeTab === 'raw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(45deg, #2ecc71, #27ae60)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '20px' }}>👤 User Information</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#00ff00',
                  padding: '20px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  overflow: 'auto',
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify({
                    user_id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_sign_in: user.last_sign_in_at,
                    email_confirmed: user.email_confirmed_at ? 'Yes' : 'No',
                    role: user.role
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(45deg, #9b59b6, #8e44ad)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '20px' }}>
                  📊 Students Data ({students.length} records)
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#00ff00',
                  padding: '20px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(students, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input::placeholder, select option {
          color: rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>
    </div>
  )
}
