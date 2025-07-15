import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
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
        🎉 GITHUB EDIT SUCCESSFUL! 🎉
      </h1>
      <p style={{ fontSize: '30px', marginBottom: '20px' }}>
        Direct GitHub edit worked!
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
