import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
  const [students, setStudents] = useState([])

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setStudents(data || [])
    }
  }

  const signOut = () => {
    supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>🥋 Taekwondo Club ({students.length} members)</h1>
        <button 
          onClick={signOut}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {students.map((student) => (
          <div key={student.id} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>
              {student.first_name} {student.last_name}
            </h3>
            <p>📧 {student.email}</p>
            {student.student_id && <p>🆔 {student.student_id}</p>}
            {student.grade_level && <p>🥋 {student.grade_level}</p>}
          </div>
        ))}
      </div>

      {students.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '8px'
        }}>
          <h3>No members yet</h3>
          <p>Members will appear here once added</p>
        </div>
      )}
    </div>
  )
}
