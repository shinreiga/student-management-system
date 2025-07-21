import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
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

  const signOut = () => {
    supabase.auth.signOut()
    window.location.reload()
  }

  const isAdmin = userProfile?.role === 'admin'
  const canEdit = (studentUserId) => isAdmin || studentUserId === user.id

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
          <button 
            onClick={signOut}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
