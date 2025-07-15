import { useAuth } from '../hooks/useAuth'
import Auth from './Auth'
import Dashboard from './Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user ? <Dashboard user={user} /> : <Auth />}
    </div>
  )
}