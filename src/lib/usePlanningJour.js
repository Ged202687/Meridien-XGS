import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { formatDateISO } from './dateUtils'

export function usePlanningJour(agentId, date) {
  const [planning, setPlanning] = useState(null)
  const [pauses, setPauses] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    if (!agentId || !date) return
    let annule = false

    async function charger() {
      setChargement(true)
      setErreur(null)

      const { data: planningData, error: erreurPlanning } = await supabase
        .from('plannings')
        .select('*')
        .eq('agent_id', agentId)
        .eq('date', formatDateISO(date))
        .maybeSingle()

      if (annule) return

      if (erreurPlanning) {
        setErreur(erreurPlanning.message)
        setChargement(false)
        return
      }

      setPlanning(planningData)

      if (planningData && planningData.statut === 'travail') {
        const { data: pausesData, error: erreurPauses } = await supabase
          .from('pauses')
          .select('*')
          .eq('planning_id', planningData.id)
          .order('heure_debut', { ascending: true })

        if (annule) return
        if (erreurPauses) {
          setErreur(erreurPauses.message)
        } else {
          setPauses(pausesData ?? [])
        }
      } else {
        setPauses([])
      }

      setChargement(false)
    }

    charger()
    return () => {
      annule = true
    }
  }, [agentId, date])

  return { planning, pauses, chargement, erreur }
}
