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
    emergency_contact_number: '',
    insurance_expiry: ''
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
      .select(`
        *,
        uploader:uploaded_by (
          email
        )
      `)
      .eq('student_id', studentId)
      .order('uploaded_at', { ascending: false })

    if (!error) {
      setStudentDocuments(data || [])
    }
  }

  const uploadDocument = async (file, studentId, documentType = 'general') => {
    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

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
        const { error: storageError } = await supabase.storage
          .from('student-documents')
          .remove([filePath])

        if (storageError) throw storageError

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
          insurance_expiry: newStudent.insurance_expiry || null,
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
        emergency_contact_number: '',
        insurance_expiry: ''
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

  const isInsuranceExpired = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  const isInsuranceExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    return expiry >= today && expiry <= thirtyDaysFromNow
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

  const openStudentDetails = async (student) => {
    setSelectedStudent(student)
    await fetchStudentDocuments(student.id)
    setActiveTab('documents')
  }

  const isAdmin = userProfile?.role === 'admin'
  const canEdit = (studentUserId) => isAdmin || studentUserId === user.id

  const getStudentDisplayData = (student) => {
    return student
  }

  return (
    <>
      <style>
        {`
          @keyframes flash {
            0%, 50% { background-color: #fef2f2; }
            25%, 75% { background-color: #fee2e2; }
          }
          
          @media (max-width: 480px) {
            .mobile-grid {
              grid-template-columns: 1fr !important;
            }
            .mobile-single {
              min-width: unset !important;
              width: 100% !important;
            }
            .mobile-text {
              font-size: 14px !important;
            }
            .mobile-padding {
              padding: 10px !important;
            }
          }
          
          @media (max-width: 768px) {
            .tablet-grid {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
            }
          }
        `}
      </style>
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        fontFamily: 'Arial, sans-serif'
      }}>
        <header style={{
          background: 'white',
          borderBottom: '3px solid #dc2626',
          padding: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{ minWidth: '200px' }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '24px', 
                color: '#1f2937',
                fontWeight: 'bold'
              }}>
                🥋 National Taekwondo Club
              </h1>
              <p style={{ 
                margin: '5px 0 0 0', 
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {isAdmin ? 'Instructor Panel' : 'Member Portal'} | {students.length} members
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: isAdmin ? '#dc2626' : '#374151',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                {isAdmin ? 'INSTRUCTOR' : 'MEMBER'}
              </span>
              <button 
                onClick={signOut}
                style={{
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  minHeight: '44px'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 15px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              justifyContent: 'flex-start'
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
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'documents' && selectedStudent && (
            <div>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '20px 15px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '3px solid #dc2626'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#1f2937', fontWeight: 'bold' }}>
                      🥋 {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <p style={{ margin: 0, fontSize: '16px', color: '#6b7280' }}>
                      Member Profile & Documents
                    </p>
                  </div>
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
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      alignSelf: 'flex-start'
                    }}
                  >
                    ← Back to Members
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px'
                }} className="tablet-grid">
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '15px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151', fontWeight: 'bold' }}>
                      📋 Basic Information
                    </h3>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <p style={{ margin: '8px 0', color: '#374151' }}>
                        <strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.last_name}
                      </p>
                      <p style={{ margin: '8px 0', color: '#374151' }}>
                        <strong>Email:</strong> {selectedStudent.email}
                      </p>
                      {selectedStudent.bt_id && (
                        <p style={{ margin: '8px 0', color: '#374151' }}>
                          <strong>🆔 BT ID:</strong> {selectedStudent.bt_id}
                        </p>
                      )}
                      {selectedStudent.grade_level && (
                        <p style={{ margin: '8px 0', color: '#059669', fontWeight: 'bold' }}>
                          <strong>🥋 Belt Level:</strong> {selectedStudent.grade_level} Belt
                        </p>
                      )}
                      {selectedStudent.enrollment_date && (
                        <p style={{ margin: '8px 0', color: '#6b7280' }}>
                          <strong>📅 Joined:</strong> {new Date(selectedStudent.enrollment_date).toLocaleDateString()}
                        </p>
                      )}
                      {selectedStudent.insurance_expiry && (
                        <p style={{ 
                          margin: '8px 0', 
                          color: isInsuranceExpired(selectedStudent.insurance_expiry) 
                            ? '#991b1b' 
                            : isInsuranceExpiringSoon(selectedStudent.insurance_expiry) 
                              ? '#92400e' 
                              : '#065f46',
                          fontWeight: isInsuranceExpired(selectedStudent.insurance_expiry) ? 'bold' : 'normal'
                        }}>
                          <strong>🛡️ Insurance Expires:</strong> {new Date(selectedStudent.insurance_expiry).toLocaleDateString()}
                          {isInsuranceExpired(selectedStudent.insurance_expiry) && ' ⚠️ EXPIRED'}
                          {isInsuranceExpiringSoon(selectedStudent.insurance_expiry) && ' ⚠️ EXPIRES SOON'}
                        </p>
                      )}
                    </div>
                  </div>

                  {(selectedStudent.contact_email || selectedStudent.contact_number) && (
                    <div style={{
                      background: '#f0f9ff',
                      borderRadius: '8px',
                      padding: '15px',
                      border: '2px solid #0ea5e9'
                    }}>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0c4a6e', fontWeight: 'bold' }}>
                        📞 Contact Information
                      </h3>
                      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        {selectedStudent.contact_email && (
                          <p style={{ margin: '8px 0', color: '#0c4a6e' }}>
                            <strong>📧 Contact Email:</strong> {selectedStudent.contact_email}
                          </p>
                        )}
                        {selectedStudent.contact_number && (
                          <p style={{ margin: '8px 0', color: '#0c4a6e' }}>
                            <strong>📱 Phone Number:</strong> {selectedStudent.contact_number}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedStudent.emergency_contact_number && (
                    <div style={{
                      background: '#fef2f2',
                      borderRadius: '8px',
                      padding: '15px',
                      border: '2px solid #dc2626'
                    }}>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#991b1b', fontWeight: 'bold' }}>
                        🚨 Emergency Contact
                      </h3>
                      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        <p style={{ margin: '8px 0', color: '#991b1b', fontWeight: 'bold' }}>
                          <strong>Emergency Number:</strong> {selectedStudent.emergency_contact_number}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#1f2937' }}>
                  📁 Document Management
                </h3>

                {(isAdmin || canEdit(selectedStudent.user_id)) && (
                  <div style={{
                    background: '#f8f9fa',
                    border: '2px dashed #dc2626',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center',
                    marginBottom: '15px'
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
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
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
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: '15px'
                    }} className="tablet-grid">
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
                              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280' }}>
                                {formatFileSize(doc.file_size)} • {doc.file_type}
                              </p>
                              <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>
                                <p style={{ margin: '2px 0' }}>
                                  <strong>Uploaded:</strong> {new Date(doc.uploaded_at).toLocaleDateString()} at {new Date(doc.uploaded_at).toLocaleTimeString()}
                                </p>
                                <p style={{ margin: '2px 0' }}>
                                  <strong>By:</strong> {doc.uploader?.email || 'Unknown User'}
                                </p>
                              </div>
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

          {activeTab === 'add' && isAdmin && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px 15px',
              marginBottom: '20px',
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px'
                }} className="tablet-grid mobile-grid">
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
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#374151'
                    }}>
                      Insurance Expiry Date
                    </label>
                    <input
                      type="date"
                      value={newStudent.insurance_expiry}
                      onChange={(e) => setNewStudent({ ...newStudent, insurance_expiry: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
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
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
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

          {activeTab === 'adduser' && isAdmin && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px 15px',
              marginBottom: '20px',
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px'
                }} className="tablet-grid mobile-grid">
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

          {activeTab === 'students' && (
            <div>
              <h2 style={{ 
                margin: '0 0 20px 0',
                fontSize: '24px',
                color: '#1f2937'
              }}>
                Club Members ({students.length})
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '15px'
              }} className="tablet-grid">
                {students.map((student, index) => {
                  const displayData = getStudentDisplayData(student)
                  const canEditThis = canEdit(student.user_id)
                  
                  return (
                    <div key={student.id} style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '20px 15px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: `3px solid ${index % 2 === 0 ? '#dc2626' : '#374151'}`
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '15px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            margin: '0 0 10px 0',
                            fontSize: '20px',
                            color: '#1f2937',
                            fontWeight: 'bold'
                          }}>
                            {displayData.first_name} {displayData.last_name}
                          </h3>
                          <p style={{ 
                            margin: '0 0 10px 0', 
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>
                            📧 {student.email}
                          </p>
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
                      
                      <div style={{ marginBottom: '15px' }}>
                        {displayData.bt_id && (
                          <p style={{ 
                            margin: '6px 0',
                            fontSize: '14px',
                            color: '#374151'
                          }}>
                            🆔 <strong>BT ID:</strong> {displayData.bt_id}
                          </p>
                        )}
                        {student.grade_level && (
                          <p style={{ 
                            margin: '6px 0',
                            fontSize: '14px',
                            color: '#059669',
                            fontWeight: 'bold'
                          }}>
                            🥋 <strong>Belt Level:</strong> {student.grade_level} Belt
                          </p>
                        )}
                        <p style={{ 
                          margin: '6px 0',
                          fontSize: '13px',
                          color: '#6b7280'
                        }}>
                          📅 <strong>Joined:</strong> {new Date(student.enrollment_date).toLocaleDateString()}
                        </p>
                      </div>

                      {student.insurance_expiry && (
                        <div style={{ 
                          marginBottom: '15px',
                          padding: '12px',
                          background: isInsuranceExpired(student.insurance_expiry) 
                            ? '#fef2f2' 
                            : isInsuranceExpiringSoon(student.insurance_expiry) 
                              ? '#fffbeb' 
                              : '#f0fdf4',
                          borderRadius: '6px',
                          border: isInsuranceExpired(student.insurance_expiry) 
                            ? '2px solid #dc2626' 
                            : isInsuranceExpiringSoon(student.insurance_expiry) 
                              ? '2px solid #f59e0b' 
                              : '2px solid #10b981',
                          animation: isInsuranceExpired(student.insurance_expiry) 
                            ? 'flash 1s infinite' 
                            : 'none'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            color: isInsuranceExpired(student.insurance_expiry) 
                              ? '#991b1b' 
                              : isInsuranceExpiringSoon(student.insurance_expiry) 
                                ? '#92400e' 
                                : '#065f46',
                            fontWeight: 'bold'
                          }}>
                            🛡️ Insurance Status
                          </h4>
                          <p style={{ 
                            margin: '4px 0',
                            fontSize: '13px',
                            color: isInsuranceExpired(student.insurance_expiry) 
                              ? '#991b1b' 
                              : isInsuranceExpiringSoon(student.insurance_expiry) 
                                ? '#92400e' 
                                : '#065f46',
                            fontWeight: isInsuranceExpired(student.insurance_expiry) ? 'bold' : 'normal'
                          }}>
                            <strong>Expires:</strong> {new Date(student.insurance_expiry).toLocaleDateString()}
                            {isInsuranceExpired(student.insurance_expiry) && ' ⚠️ EXPIRED'}
                            {isInsuranceExpiringSoon(student.insurance_expiry) && ' ⚠️ EXPIRES SOON'}
                          </p>
                        </div>
                      )}

                      {(student.contact_email || student.contact_number) && (
                        <div style={{ 
                          marginBottom: '15px',
                          padding: '12px',
                          background: '#f0f9ff',
                          borderRadius: '6px',
                          border: '1px solid #0ea5e9'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            color: '#0c4a6e',
                            fontWeight: 'bold'
                          }}>
                            📞 Contact Information
                          </h4>
                          {student.contact_email && (
                            <p style={{ 
                              margin: '4px 0',
                              fontSize: '13px',
                              color: '#0c4a6e'
                            }}>
                              📧 <strong>Contact Email:</strong> {student.contact_email}
                            </p>
                          )}
                          {student.contact_number && (
                            <p style={{ 
                              margin: '4px 0',
                              fontSize: '13px',
                              color: '#0c4a6e'
                            }}>
                              📱 <strong>Phone:</strong> {student.contact_number}
                            </p>
                          )}
                        </div>
                      )}

                      {student.emergency_contact_number && (
                        <div style={{ 
                          marginBottom: '15px',
                          padding: '12px',
                          background: '#fef2f2',
                          borderRadius: '6px',
                          border: '1px solid #dc2626'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            color: '#991b1b',
                            fontWeight: 'bold'
                          }}>
                            🚨 Emergency Contact
                          </h4>
                          <p style={{ 
                            margin: '4px 0',
                            fontSize: '13px',
                            color: '#991b1b',
                            fontWeight: 'bold'
                          }}>
                            📞 {student.emergency_contact_number}
                          </p>
                        </div>
                      )}

                      {!student.bt_id && !student.grade_level && !student.contact_email && 
                       !student.contact_number && !student.emergency_contact_number && !student.insurance_expiry && (
                        <div style={{ 
                          marginBottom: '15px',
                          padding: '10px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <p style={{ 
                            margin: 0,
                            fontSize: '13px',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            Additional information to be added
                          </p>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                        <button
                          onClick={() => openStudentDetails(student)}
                          style={{
                            background: '#374151',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: 'bold',
                            minHeight: '44px'
                          }}
                        >
                          📁 View Documents & Full Profile
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
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>BT ID</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Belt Level</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Insurance</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Contact Info</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Emergency</th>
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
                          <td style={{ padding: '15px' }}>{student.email}</td>
                          <td style={{ padding: '15px' }}>
                            {student.grade_level ? `${student.grade_level} Belt` : '—'}
                          </td>
                          <td style={{ 
                            padding: '15px',
                            background: student.insurance_expiry && isInsuranceExpired(student.insurance_expiry) 
                              ? '#fef2f2' 
                              : 'transparent',
                            animation: student.insurance_expiry && isInsuranceExpired(student.insurance_expiry) 
                              ? 'flash 1s infinite' 
                              : 'none'
                          }}>
                            {student.insurance_expiry ? (
                              <div style={{ fontSize: '12px' }}>
                                <div style={{ 
                                  color: isInsuranceExpired(student.insurance_expiry) 
                                    ? '#991b1b' 
                                    : isInsuranceExpiringSoon(student.insurance_expiry) 
                                      ? '#92400e' 
                                      : '#065f46',
                                  fontWeight: isInsuranceExpired(student.insurance_expiry) ? 'bold' : 'normal'
                                }}>
                                  🛡️ {new Date(student.insurance_expiry).toLocaleDateString()}
                                </div>
                                {isInsuranceExpired(student.insurance_expiry) && (
                                  <div style={{ color: '#991b1b', fontWeight: 'bold' }}>⚠️ EXPIRED</div>
                                )}
                                {isInsuranceExpiringSoon(student.insurance_expiry) && (
                                  <div style={{ color: '#92400e', fontWeight: 'bold' }}>⚠️ EXPIRES SOON</div>
                                )}
                              </div>
                            ) : '—'}
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
    </>
  )
}