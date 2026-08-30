import { supabase } from './supabaseClient'
import { formatDateISO, heureVersMinutes as heureVersMinutesLocal } from './dateUtils'

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
  const gardeHoraires = statut === 'travail' || statut === 'formation'
  const payload = {
    agent_id: agentId,
    date: formatDateISO(date),
    statut,
    modele_horaire_id: statut === 'travail' ? modeleHoraireId : null,
    heure_debut: gardeHoraires ? heureDebut : null,
    heure_fin: gardeHoraires ? heureFin : null,
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

    const dureeT1 = (heureVersMinutesLocal(params.heure_fin_tranche_1) - heureVersMinutesLocal(params.heure_debut_tranche_1))
    const dureeT2 = (heureVersMinutesLocal(params.heure_fin_tranche_2) - heureVersMinutesLocal(params.heure_debut_tranche_2))
    const fenetre1 = Math.max(dureeT1 - params.delai_min_avant_pause_min - params.duree_pause_min, 0)
    const fenetre2 = Math.max(dureeT2 - params.delai_min_avant_pause_min - params.duree_pause_min, 0)
    const offset1 = Math.floor(Math.random() * (fenetre1 + 1))
    const offset2 = Math.floor(Math.random() * (fenetre2 + 1))
    const offsetDej = Math.floor(Math.random() * (params.fenetre_flex_dejeuner_min + 1)) - Math.floor(params.fenetre_flex_dejeuner_min / 2)

    const { error: erreurPauses } = await supabase.from('pauses').insert([
      {
        planning_id: planning.id,
        type_pause: 'pause15_tranche1',
        heure_debut: ajouterMinutes(params.heure_debut_tranche_1, params.delai_min_avant_pause_min + offset1),
        heure_fin: ajouterMinutes(params.heure_debut_tranche_1, params.delai_min_avant_pause_min + offset1 + params.duree_pause_min),
      },
      {
        planning_id: planning.id,
        type_pause: 'pause15_tranche2',
        heure_debut: ajouterMinutes(params.heure_debut_tranche_2, params.delai_min_avant_pause_min + offset2),
        heure_fin: ajouterMinutes(params.heure_debut_tranche_2, params.delai_min_avant_pause_min + offset2 + params.duree_pause_min),
      },
      {
        planning_id: planning.id,
        type_pause: 'dejeuner',
        heure_debut: ajouterMinutes(params.heure_pivot_dejeuner, offsetDej),
        heure_fin: ajouterMinutes(params.heure_pivot_dejeuner, offsetDej + params.duree_dejeuner_min),
      },
    ])
    if (erreurPauses) throw erreurPauses
  }

  return planning
}
