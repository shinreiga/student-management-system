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
  const [activeTab, setActiveTab] = useState('students') // 'students', 'table', or 'raw'

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
          student_id: newStudent.student_id,
          grade_level: newStudent.grade_level,
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Student Management System</h1>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded ${
                activeTab === 'students' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Students View
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded ${
                activeTab === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 rounded ${
                activeTab === 'raw' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Raw Data
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Welcome, {user.email}</span>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Add Student Form */}
      <form onSubmit={createStudent} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            value={newStudent.first_name}
            onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newStudent.last_name}
            onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Student ID (optional)"
            value={newStudent.student_id}
            onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newStudent.grade_level}
            onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Grade Level</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="1st Grade">1st Grade</option>
            <option value="2nd Grade">2nd Grade</option>
            <option value="3rd Grade">3rd Grade</option>
            <option value="4th Grade">4th Grade</option>
            <option value="5th Grade">5th Grade</option>
            <option value="6th Grade">6th Grade</option>
            <option value="7th Grade">7th Grade</option>
            <option value="8th Grade">8th Grade</option>
            <option value="9th Grade">9th Grade</option>
            <option value="10th Grade">10th Grade</option>
            <option value="11th Grade">11th Grade</option>
            <option value="12th Grade">12th Grade</option>
          </select>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Adding Student...' : 'Add Student'}
            </button>
          </div>
        </div>
      </form>

      {/* Students Card View */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Students ({students.length})</h2>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No students registered yet.</p>
              <p className="text-sm mt-2">Add your first student using the form above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div key={student.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {student.student_id && (
                      <p><span className="font-medium">Student ID:</span> {student.student_id}</p>
                    )}
                    {student.grade_level && (
                      <p><span className="font-medium">Grade:</span> {student.grade_level}</p>
                    )}
                    <p><span className="font-medium">Enrolled:</span> {new Date(student.enrollment_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Students Database Table</h2>
            <p className="text-sm text-gray-600 mt-1">{students.length} students registered</p>
          </div>
          
          {students.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No students in database yet.</p>
              <p className="text-sm mt-2">Add your first student above to see table data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {student.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{student.first_name} {student.last_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.student_id || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.grade_level || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(student.enrollment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
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
          
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Database: PostgreSQL | Table: students</span>
              <span>Showing all students for user: {user.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data View */}
      {activeTab === 'raw' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Students Data ({students.length} records)</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(students, null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Schema Info</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-mono text-sm">
                <strong>Table:</strong> students<br/>
                <strong>Columns:</strong><br/>
                • id (UUID, Primary Key)<br/>
                • first_name (TEXT, Required)<br/>
                • last_name (TEXT, Required)<br/>
                • email (TEXT, Required, Unique)<br/>
                • student_id (TEXT, Optional, Unique)<br/>
                • grade_level (TEXT, Optional)<br/>
                • enrollment_date (DATE, Default: today)<br/>
                • user_id (UUID, Foreign Key → auth.users)<br/>
                • created_at (TIMESTAMP)<br/>
                • updated_at (TIMESTAMP)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}