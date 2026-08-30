import { supabase } from './supabaseClient'
import { ajouterJours, formatDateISO } from './dateUtils'

// Jours travaillés de l'agent sur la semaine (candidats à un échange)
export async function listerMesJoursTravailles(agentId, lundi) {
  const dimanche = ajouterJours(lundi, 6)
  const { data, error } = await supabase
    .from('plannings')
    .select('id, date, heure_debut, heure_fin')
    .eq('agent_id', agentId)
    .eq('statut', 'travail')
    .gte('date', formatDateISO(lundi))
    .lte('date', formatDateISO(dimanche))
    .order('date')
  if (error) throw error
  return data
}

// Autres agents déjà en repos ce jour-là (candidats pour l'échange)
export async function listerCandidatsPourDate(agentId, date) {
  const { data, error } = await supabase
    .from('plannings')
    .select('id, agent_id, statut, agent:profils_planning(nom_complet, actif)')
    .eq('date', formatDateISO(date))
    .in('statut', ['repos_fixe', 'repos_rotatif'])
    .neq('agent_id', agentId)
  if (error) throw error
  return (data ?? []).filter((p) => p.agent?.actif)
}

export async function creerDemandeSwap({ demandeurId, planningDemandeurId, agentCibleId, planningCibleId, motif }) {
  const { error } = await supabase.from('demandes_swap').insert({
    demandeur_id: demandeurId,
    planning_demandeur_id: planningDemandeurId,
    agent_cible_id: agentCibleId,
    planning_cible_id: planningCibleId,
    motif: motif || null,
  })
  if (error) throw error
}

export async function listerMesDemandesSwap(agentId) {
  const { data, error } = await supabase
    .from('demandes_swap')
    .select(`
      id, statut, motif, cree_le,
      cible:profils_planning!demandes_swap_agent_cible_id_fkey(nom_complet),
      planning_demandeur:plannings!demandes_swap_planning_demandeur_id_fkey(date),
      planning_cible:plannings!demandes_swap_planning_cible_id_fkey(date)
    `)
    .or(`demandeur_id.eq.${agentId},agent_cible_id.eq.${agentId}`)
    .order('cree_le', { ascending: false })
  if (error) throw error
  return data
}

// --- Super admin : file de validation ---

export async function listerDemandesSwapAdmin(filtreStatut) {
  let requete = supabase
    .from('demandes_swap')
    .select(`
      id, statut, motif, cree_le,
      demandeur:profils_planning!demandes_swap_demandeur_id_fkey(nom_complet),
      cible:profils_planning!demandes_swap_agent_cible_id_fkey(nom_complet),
      planning_demandeur:plannings!demandes_swap_planning_demandeur_id_fkey(date),
      planning_cible:plannings!demandes_swap_planning_cible_id_fkey(date)
    `)
    .order('cree_le', { ascending: false })

  if (filtreStatut) requete = requete.eq('statut', filtreStatut)

  const { data, error } = await requete
  if (error) throw error
  return data
}

export async function traiterDemandeSwap(demandeId, valider) {
  const { error } = await supabase.rpc('traiter_demande_swap', {
    p_demande_id: demandeId,
    p_valider: valider,
  })
  if (error) throw error
}
