import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { ajouterJours, formatDateISO } from './dateUtils'

export function usePlanningSemaine(agentId, lundi) {
  const [jours, setJours] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    if (!agentId || !lundi) return
    let annule = false

    async function charger() {
      setChargement(true)
      setErreur(null)

      const dimanche = ajouterJours(lundi, 6)
      const { data, error } = await supabase
        .from('plannings')
        .select('*')
        .eq('agent_id', agentId)
        .gte('date', formatDateISO(lundi))
        .lte('date', formatDateISO(dimanche))

      if (annule) return

      if (error) {
        setErreur(error.message)
        setChargement(false)
        return
      }

      const parDate = new Map((data ?? []).map((p) => [p.date, p]))
      const semaine = Array.from({ length: 7 }, (_, i) => {
        const date = ajouterJours(lundi, i)
        return { date, planning: parDate.get(formatDateISO(date)) ?? null }
      })

      setJours(semaine)
      setChargement(false)
    }

    charger()
    return () => {
      annule = true
    }
  }, [agentId, lundi])

  return { jours, chargement, erreur }
}
