import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Routage from './pages/Routage'
import './styles/page.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setPret(true)
    })

    const { data: abonnement } = supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      setSession((sessionActuelle) => {
        if (sessionActuelle?.user?.id === nouvelleSession?.user?.id) return sessionActuelle
        return nouvelleSession
      })
    })

    return () => abonnement.subscription.unsubscribe()
  }, [])

  if (!pret) return null

  if (!session) {
    return <Login onConnecte={setSession} />
  }

  return <Routage session={session} />
}
