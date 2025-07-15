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
      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '60px', marginBottom: '20px' }}>
        🎉 MAJOR UPDATE SUCCESSFUL! 🎉
      </h1>
      <p style={{ fontSize: '30px', marginBottom: '20px' }}>
        This is the new modern design!
      </p>
      <p>User: {user.email}</p>
      <button 
        onClick={signOut}
        style={{
          background: '#FF4757',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '10px',
          fontSize: '20px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Sign Out
      </button>
    </div>
  )
}