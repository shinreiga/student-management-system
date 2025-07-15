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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SM</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Student Management
                </h1>
                <p className="text-sm text-gray-500">Manage your students with ease</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/70 backdrop-blur-sm p-1 rounded-2xl shadow-lg border border-gray-200/50">
            {[
              { id: 'students', label: 'Students', icon: '👥' },
              { id: 'table', label: 'Table View', icon: '📊' },
              { id: 'raw', label: 'Raw Data', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modern Add Student Form */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3">✨</span>
                Add New Student
              </h2>
              <p className="text-blue-100 mt-1">Enter student information below</p>
            </div>
            <form onSubmit={createStudent} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Student ID</label>
                  <input
                    type="text"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Optional student ID"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Grade Level</label>
                  <select
                    value={newStudent.grade_level}
                    onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none font-medium"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Student...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="mr-2">+</span>
                      Add Student
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Students Card View */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">👥</span>
                Students ({students.length})
              </h2>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-200/50">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-xl text-gray-600 mb-2">No students registered yet</p>
                <p className="text-gray-500">Add your first student using the form above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <div key={student.id} className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-blue-100 text-sm">{student.email}</p>
                        </div>
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="text-red-200 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-red-500/30"
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      {student.student_id && (
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500">🆔</span>
                          <span className="text-sm text-gray-600">ID:</span>
                          <span className="text-sm font-medium">{student.student_id}</span>
                        </div>
                      )}
                      {student.grade_level && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">🎓</span>
                          <span className="text-sm text-gray-600">Grade:</span>
                          <span className="text-sm font-medium">{student.grade_level}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-500">📅</span>
                        <span className="text-sm text-gray-600">Enrolled:</span>
                        <span className="text-sm font-medium">{new Date(student.enrollment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modern Table View */}
        {activeTab === 'table' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3">📊</span>
                Students Database Table
              </h2>
              <p className="text-blue-100 mt-1">{students.length} students registered</p>
            </div>
            
            {students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">No records in database yet</p>
                <p className="text-sm mt-2">Add your first student above to see table data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      {['ID', 'Name', 'Email', 'Student ID', 'Grade Level', 'Enrollment Date', 'Actions'].map((header) => (
                        <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {students.map((student, index) => (
                      <tr key={student.id} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/30'} hover:bg-blue-50/50 transition-colors duration-200`}>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                          {student.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.first_name} {student.last_name}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-all duration-200"
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
            
            <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-200/50">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Database: PostgreSQL | Table: students</span>
                <span>Showing all students for user: {user.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modern Raw Data View */}
        {activeTab === 'raw' && (
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-3">👤</span>
                  User Information
                </h2>
              </div>
              <div className="p-8">
                <div className="bg-gray-900 rounded-2xl p-6">
                  <pre className="text-green-400 text-sm overflow-x-auto">
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
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-3">📊</span>
                  Students Data ({students.length} records)
                </h2>
              </div>
              <div className="p-8">
                <div className="bg-gray-900 rounded-2xl p-6">
                  <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(students, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-3">🔧</span>
                  Database Schema Info
                </h2>
              </div>
              <div className="p-8">
                <div className="bg-gray-100 rounded-2xl p-6">
                  <p className="font-mono text-sm leading-relaxed">
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
          </div>
        )}
      </div>
    </div>
  )
}