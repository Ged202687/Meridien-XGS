import { supabase } from './supabaseClient'
import { ajouterJours, formatDateISO } from './dateUtils'

export async function injecterFormation({ agentIds, dateDebut, dateFin, heureDebut, heureFin, titre }) {
  const lignes = []
  let curseur = new Date(dateDebut)
  const fin = new Date(dateFin)

  while (curseur <= fin) {
    const iso = formatDateISO(curseur)
    agentIds.forEach((agentId) => {
      lignes.push({
        agent_id: agentId,
        date: iso,
        statut: 'formation',
        heure_debut: heureDebut,
        heure_fin: heureFin,
        modele_horaire_id: null,
        genere_auto: false,
      })
    })
    curseur = ajouterJours(curseur, 1)
  }

  const { data: planningsInseres, error } = await supabase
    .from('plannings')
    .upsert(lignes, { onConflict: 'agent_id,date' })
    .select('id')
  if (error) throw error

  // Une formation n'a pas de pauses calculées automatiquement — on
  // nettoie celles qui existaient pour ces jours (ex. jour auparavant travaillé)
  const ids = planningsInseres.map((p) => p.id)
  if (ids.length > 0) {
    await supabase.from('pauses').delete().in('planning_id', ids)
  }

  return lignes.length
}
