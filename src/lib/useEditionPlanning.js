import { supabase } from './supabaseClient'
import { formatDateISO } from './dateUtils'

export async function listerModelesHoraire() {
  const { data, error } = await supabase
    .from('modeles_horaire')
    .select('id, code, libelle, heure_debut, heure_fin')
    .order('code')
  if (error) throw error
  return data
}

function ajouterMinutes(heureStr, minutes) {
  const [h, m] = heureStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`
}

// Enregistre un planning jour modifié manuellement, et recalcule les
// pauses en conséquence (supprimées si non travaillé, recréées sinon).
export async function enregistrerPlanningJour({ agentId, date, statut, modeleHoraireId, heureDebut, heureFin }) {
  const payload = {
    agent_id: agentId,
    date: formatDateISO(date),
    statut,
    modele_horaire_id: statut === 'travail' ? modeleHoraireId : null,
    heure_debut: statut === 'travail' ? heureDebut : null,
    heure_fin: statut === 'travail' ? heureFin : null,
    genere_auto: false,
  }

  const { data: planning, error } = await supabase
    .from('plannings')
    .upsert(payload, { onConflict: 'agent_id,date' })
    .select()
    .single()
  if (error) throw error

  await supabase.from('pauses').delete().eq('planning_id', planning.id)

  if (statut === 'travail') {
    const { data: params, error: erreurParams } = await supabase
      .from('parametres_pause')
      .select('*')
      .eq('modele_horaire_id', modeleHoraireId)
      .single()
    if (erreurParams) throw erreurParams

    const { error: erreurPauses } = await supabase.from('pauses').insert([
      {
        planning_id: planning.id,
        type_pause: 'pause15_tranche1',
        heure_debut: ajouterMinutes(params.heure_debut_tranche_1, params.delai_min_avant_pause_min),
        heure_fin: ajouterMinutes(params.heure_debut_tranche_1, params.delai_min_avant_pause_min + params.duree_pause_min),
      },
      {
        planning_id: planning.id,
        type_pause: 'pause15_tranche2',
        heure_debut: ajouterMinutes(params.heure_debut_tranche_2, params.delai_min_avant_pause_min),
        heure_fin: ajouterMinutes(params.heure_debut_tranche_2, params.delai_min_avant_pause_min + params.duree_pause_min),
      },
      {
        planning_id: planning.id,
        type_pause: 'dejeuner',
        heure_debut: params.heure_pivot_dejeuner,
        heure_fin: ajouterMinutes(params.heure_pivot_dejeuner, params.duree_dejeuner_min),
      },
    ])
    if (erreurPauses) throw erreurPauses
  }

  return planning
}
