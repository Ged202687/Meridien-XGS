import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Routage from './pages/Routage'
import { SOUS_PORTAIL, allerAuPortail } from './lib/portail'
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
    // Sous le portail : pas d'ecran de connexion propre a Méridien, c'est le
    // portail qui connecte (et qui renvoie ici). Cela vaut aussi apres une
    // deconnexion, faite ici ou depuis un autre outil.
    if (SOUS_PORTAIL) {
      allerAuPortail()
      return null
    }
    return <Login onConnecte={setSession} />
  }

  return <Routage session={session} />
}
