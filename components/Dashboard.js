import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
  const [students, setStudents] = useState([])
  const [users, setUsers] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDocuments, setStudentDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bt_id: '',
    grade_level: '',
    contact_email: '',
    contact_number: '',
    emergency_contact_number: ''
  })
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('students')

  useEffect(() => {
    fetchUserProfile()
    fetchStudents()
    if (userProfile?.role === 'admin') {
      fetchUsers()
    }
  }, [userProfile])

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

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setUsers(data || [])
    }
  }

  const fetchStudentDocuments = async (studentId) => {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId)
      .order('uploaded_at', { ascending: false })

    if (!error) {
      setStudentDocuments(data || [])
    }
  }

  const uploadDocument = async (file, studentId, documentType = 'general') => {
    setUploading(true)
    
    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${Date.now()}.${fileExt}`
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Save document record to database
      const { data, error } = await supabase
        .from('student_documents')
        .insert([{
          student_id: studentId,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          file_type: file.type,
          document_type: documentType,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString()
        }])

      if (error) throw error

      alert('Document uploaded successfully!')
      fetchStudentDocuments(studentId)
    } catch (error) {
      alert('Error uploading document: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const downloadDocument = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-documents')
        .download(filePath)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error downloading document: ' + error.message)
    }
  }

  const deleteDocument = async (documentId, filePath) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('student-documents')
          .remove([filePath])

        if (storageError) throw storageError

        // Delete from database
        const { error: dbError } = await supabase
          .from('student_documents')
          .delete()
          .eq('id', documentId)

        if (dbError) throw dbError

        alert('Document deleted successfully!')
        fetchStudentDocuments(selectedStudent.id)
      } catch (error) {
        alert('Error deleting document: ' + error.message)
      }
    }
  }

  const handleFileUpload = (event, studentId) => {
    const file = event.target.files[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      uploadDocument(file, studentId)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    return '📎'
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
          bt_id: newStudent.bt_id || null,
          grade_level: newStudent.grade_level || null,
          contact_email: newStudent.contact_email || null,
          contact_number: newStudent.contact_number || null,
          emergency_contact_number: newStudent.emergency_contact_number || null,
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
        bt_id: '',
        grade_level: '',
        contact_email: '',
        contact_number: '',
        emergency_contact_number: ''
      })
      fetchStudents()
    }
    setLoading(false)
  }

  const createUser = async (e) => {
    e.preventDefault()
    setUserLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: authData.user.id,
              email: newUser.email,
              role: newUser.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (profileError) throw profileError

        alert('User created successfully!')
        setNewUser({ email: '', password: '', role: 'user' })
        fetchUsers()
      }
    } catch (error) {
      alert('Error creating user: ' + error.message)
    }

    setUserLoading(false)
  }

  const deleteStudent = async (studentId) => {
    if (confirm('Are you sure you want to delete this student? This will also delete all their documents.')) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (!error) {
        fetchStudents()
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(null)
          setStudentDocuments([])
        }
      }
    }
  }

  const deleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (!error) {
        alert('User deleted successfully!')
        fetchUsers()
      } else {
        alert('Error deleting user: ' + error.message)
      }
    }
  }

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (!error) {
      alert('User role updated successfully!')
      fetchUsers()
    } else {
      alert('Error updating user role: ' + error.message)
    }
  }

  const resetUserPassword = async (userEmail) => {
    if (confirm(`Send password reset email to ${userEmail}?`)) {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: 'https://www.shinreiga.net/',
      })

      if (!error) {
        alert('Password reset email sent successfully!')
      } else {
        alert('Error sending password reset email: ' + error.message)
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

  const openStudentDetails = (student) => {
    setSelectedStudent(student)
    fetchStudentDocuments(student.id)
    setActiveTab('documents')
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
        bt_id: student.bt_id,
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
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'students', label: 'Members', icon: '👥' },
              { id: 'table', label: 'Table View', icon: '📋' },
              ...(selectedStudent ? [{ id: 'documents', label: `${selectedStudent.first_name}'s Documents`, icon: '📁' }] : []),
              ...(isAdmin ? [
                { id: 'add', label: 'Add Member', icon: '➕' },
                { id: 'users', label: 'User Management', icon: '👤' },
                { id: 'adduser', label: 'Add User', icon: '🆕' }
              ] : [])
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

        {/* Documents Tab */}
        {activeTab === 'documents' && selectedStudent && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
                  📁 Documents for {selectedStudent.first_name} {selectedStudent.last_name}
                </h2>
                <button
                  onClick={() => {
                    setSelectedStudent(null)
                    setStudentDocuments([])
                    setActiveTab('students')
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ← Back to Members
                </button>
              </div>

              {/* Upload Section */}
              {(isAdmin || canEdit(selectedStudent.user_id)) && (
                <div style={{
                  background: '#f8f9fa',
                  border: '2px dashed #dc2626',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📤</div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Upload Document</h3>
                  <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '14px' }}>
                    Supported formats: PDF, Images, Word, Excel (Max 10MB)
                  </p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, selectedStudent.id)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    disabled={uploading}
                    style={{
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  {uploading && (
                    <p style={{ margin: '10px 0 0 0', color: '#dc2626', fontWeight: 'bold' }}>
                      Uploading...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Documents List */}
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
                  📄 Documents ({studentDocuments.length})
                </h3>
              </div>
              
              {studentDocuments.length > 0 ? (
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '15px'
                  }}>
                    {studentDocuments.map((doc) => (
                      <div key={doc.id} style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '15px',
                        background: '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '24px', marginRight: '10px' }}>
                            {getDocumentIcon(doc.file_type)}
                          </span>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#1f2937' }}>
                              {doc.file_name}
                            </h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                            style={{
                              background: '#059669',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              flex: 1
                            }}
                          >
                            Download
                          </button>
                          {(isAdmin || canEdit(selectedStudent.user_id)) && (
                            <button
                              onClick={() => deleteDocument(doc.id, doc.file_path)}
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
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
                  <h3 style={{ color: '#374151' }}>No documents uploaded yet</h3>
                  <p>Upload the first document using the upload area above.</p>
                </div>
              )}
            </div>
          </div>
        )}

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
                    First Name *
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
                    Last Name *
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
                    Email *
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
                    BT ID
                  </label>
                  <input
                    type="text"
                    value={newStudent.bt_id}
                    onChange={(e) => setNewStudent({ ...newStudent, bt_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., BT001"
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
                    <option value="White">White</option>
                    <option value="Red">Red</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Green">Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Black">Black</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={newStudent.contact_email}
                    onChange={(e) => setNewStudent({ ...newStudent, contact_email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Alternative contact email"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={newStudent.contact_number}
                    onChange={(e) => setNewStudent({ ...newStudent, contact_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., +44 7123 456789"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    value={newStudent.emergency_contact_number}
                    onChange={(e) => setNewStudent({ ...newStudent, emergency_contact_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Emergency contact number"
                  />
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

        {/* User Management Tab (Admin Only) */}
        {activeTab === 'users' && isAdmin && (
          <div>
            <h2 style={{ 
              margin: '0 0 20px 0',
              fontSize: '24px',
              color: '#1f2937'
            }}>
              User Management ({users.length} users)
            </h2>
            
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
                  👤 System Users
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Created</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem, index) => (
                      <tr key={userItem.id} style={{
                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                      }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>
                          {userItem.email}
                          {userItem.id === user.id && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '12px', 
                              color: '#059669',
                              fontWeight: 'normal'
                            }}>
                              (You)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <select
                            value={userItem.role || 'user'}
                            onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                            disabled={userItem.id === user.id}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '14px',
                              background: userItem.role === 'admin' ? '#dc2626' : '#374151',
                              color: 'white'
                            }}
                          >
                            <option value="user">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: '15px' }}>
                          {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => resetUserPassword(userItem.email)}
                              style={{
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Reset Password
                            </button>
                            {userItem.id !== user.id && (
                              <button
                                onClick={() => deleteUser(userItem.id)}
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
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {users.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>👤</div>
                <h3 style={{ color: '#374151' }}>No users found</h3>
                <p style={{ color: '#6b7280' }}>
                  Add users using the "Add User" tab.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add User Form (Admin Only) */}
        {activeTab === 'adduser' && isAdmin && (
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
              Add New User
            </h2>
            <form onSubmit={createUser}>
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="user">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={userLoading}
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
                {userLoading ? 'Creating...' : 'Create User'}
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
                      {displayData.bt_id && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          🆔 BT ID: {displayData.bt_id}
                        </p>
                      )}
                      {isAdmin && student.grade_level && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#059669',
                          fontWeight: 'bold'
                        }}>
                          🥋 {student.grade_level} Belt
                        </p>
                      )}
                      {isAdmin && student.contact_email && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          📧 Contact: {student.contact_email}
                        </p>
                      )}
                      {isAdmin && student.contact_number && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          📞 Phone: {student.contact_number}
                        </p>
                      )}
                      {isAdmin && student.emergency_contact_number && (
                        <p style={{ 
                          margin: '8px 0',
                          fontSize: '14px',
                          color: '#dc2626',
                          fontWeight: 'bold'
                        }}>
                          🚨 Emergency: {student.emergency_contact_number}
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
                      {!isAdmin && !displayData.bt_id && (
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

                    {/* Documents Button */}
                    <div style={{ marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                      <button
                        onClick={() => openStudentDetails(student)}
                        style={{
                          background: '#374151',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        📁 View Documents
                      </button>
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
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>BT ID</th>
                    {isAdmin && (
                      <>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Belt Level</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Contact</th>
                        <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Emergency</th>
                      </>
                    )}
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
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
                          {displayData.bt_id || '—'}
                        </td>
                        {isAdmin && (
                          <>
                            <td style={{ padding: '15px' }}>{student.email}</td>
                            <td style={{ padding: '15px' }}>
                              {student.grade_level ? `${student.grade_level} Belt` : '—'}
                            </td>
                            <td style={{ padding: '15px' }}>
                              <div style={{ fontSize: '12px' }}>
                                {student.contact_email && (
                                  <div>📧 {student.contact_email}</div>
                                )}
                                {student.contact_number && (
                                  <div>📞 {student.contact_number}</div>
                                )}
                                {!student.contact_email && !student.contact_number && '—'}
                              </div>
                            </td>
                            <td style={{ padding: '15px' }}>
                              {student.emergency_contact_number ? (
                                <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>
                                  🚨 {student.emergency_contact_number}
                                </span>
                              ) : '—'}
                            </td>
                          </>
                        )}
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => openStudentDetails(student)}
                              style={{
                                background: '#374151',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              📁 Documents
                            </button>
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
                          </div>
                        </td>
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