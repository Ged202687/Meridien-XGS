import { supabase } from './supabaseClient'

// Équipes que ce profil gère : directement (coach) ou via ses coachs (superviseur)
export async function listerEquipesGerees(profil) {
  if (profil.role === 'coach') {
    const { data, error } = await supabase.from('equipes').select('id, nom').eq('coach_id', profil.id)
    if (error) throw error
    return data
  }

  if (profil.role === 'superviseur') {
    const { data: coachs, error: erreurCoachs } = await supabase
      .from('profils_planning')
      .select('id')
      .eq('superviseur_id', profil.id)
    if (erreurCoachs) throw erreurCoachs

    const coachIds = (coachs ?? []).map((c) => c.id)
    if (coachIds.length === 0) return []

    const { data, error } = await supabase.from('equipes').select('id, nom').in('coach_id', coachIds)
    if (error) throw error
    return data
  }

  return []
}

export async function listerAgentsDesEquipes(equipeIds) {
  if (equipeIds.length === 0) return []
  const { data, error } = await supabase
    .from('profils_planning')
    .select('id, nom_complet, role, matricule, actif, equipe_id')
    .in('equipe_id', equipeIds)
    .order('nom_complet')
  if (error) throw error
  return data
}

export async function listerPlanningsDuJourPourAgents(agentIds, date) {
  if (agentIds.length === 0) return []
  const iso = date.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('plannings')
    .select('*')
    .in('agent_id', agentIds)
    .eq('date', iso)
  if (error) throw error
  return data
}
