import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  formatDateISO,
  premierJourAffichageMois,
  dernierJourAffichageMois,
  ajouterJours,
} from './dateUtils'

export function usePlanningMois(agentId, moisDate) {
  const [semaines, setSemaines] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    if (!agentId || !moisDate) return
    let annule = false

    async function charger() {
      setChargement(true)
      setErreur(null)

      const debut = premierJourAffichageMois(moisDate)
      const fin = dernierJourAffichageMois(moisDate)

      const { data, error } = await supabase
        .from('plannings')
        .select('*')
        .eq('agent_id', agentId)
        .gte('date', formatDateISO(debut))
        .lte('date', formatDateISO(fin))

      if (annule) return

      if (error) {
        setErreur(error.message)
        setChargement(false)
        return
      }

      const parDate = new Map((data ?? []).map((p) => [p.date, p]))
      const jours = []
      let curseur = debut
      while (curseur <= fin) {
        jours.push({
          date: curseur,
          planning: parDate.get(formatDateISO(curseur)) ?? null,
          horsMois: curseur.getMonth() !== moisDate.getMonth(),
        })
        curseur = ajouterJours(curseur, 1)
      }

      const decoupeEnSemaines = []
      for (let i = 0; i < jours.length; i += 7) {
        decoupeEnSemaines.push(jours.slice(i, i + 7))
      }

      setSemaines(decoupeEnSemaines)
      setChargement(false)
    }

    charger()
    return () => {
      annule = true
    }
  }, [agentId, moisDate])

  return { semaines, chargement, erreur }
}
