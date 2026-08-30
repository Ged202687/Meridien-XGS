import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Récupère la ligne profils_planning (rôle, équipe, nom) de l'utilisateur
// actuellement connecté. Tant que ça charge, `profil` reste null.
export function useProfil(session) {
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    if (!session) {
      setProfil(null)
      setChargement(false)
      return
    }

    let annule = false

    async function charger() {
      setChargement(true)
      const { data, error } = await supabase
        .from('profils_planning')
        .select('id, nom_complet, role, equipe_id, actif')
        .eq('id', session.user.id)
        .single()

      if (annule) return

      if (error) {
        setErreur(error.message)
      } else {
        setProfil(data)
      }
      setChargement(false)
    }

    charger()
    return () => {
      annule = true
    }
  }, [session])

  return { profil, chargement, erreur }
}
