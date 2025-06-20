import React, { useEffect, useState } from 'react'
import AuthPage from './AuthPage'
import Dashboard from './Dashboard'
import { supabase } from './supabaseClient'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return session ? <Dashboard /> : <AuthPage />
}

export default App
