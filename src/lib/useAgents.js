import { supabase } from './supabaseClient'

export async function listerAgents() {
  const { data, error } = await supabase
    .from('profils_planning')
    .select('id, nom_complet, matricule, role, actif, superviseur_id, equipe:equipes(id, nom)')
    .order('nom_complet', { ascending: true })
  if (error) throw error
  return data
}

export async function listerEquipes() {
  const { data, error } = await supabase.from('equipes').select('id, nom').order('nom')
  if (error) throw error
  return data
}

export async function getGroupeWeekend(agentId) {
  const { data, error } = await supabase
    .from('equite_rotation')
    .select('groupe_weekend')
    .eq('agent_id', agentId)
    .maybeSingle()
  if (error) throw error
  return data?.groupe_weekend ?? null
}

export async function setGroupeWeekend(agentId, groupe) {
  const { error } = await supabase
    .from('equite_rotation')
    .upsert({ agent_id: agentId, groupe_weekend: groupe }, { onConflict: 'agent_id' })
  if (error) throw error
}

// Recherche des comptes Auréo (table public.profils, colonne login) qui
// n'ont pas encore de ligne dans profils_planning — pour les rattacher.
// Passe par une fonction dédiée (voir migration 07) plutôt qu'une lecture
// directe, pour ne pas dépendre de la RLS/is_admin() propre à Auréo.
export async function rechercherComptesAureoDisponibles(recherche) {
  const { data, error } = await supabase.rpc('rechercher_comptes_aureo_disponibles', {
    p_recherche: recherche,
  })
  if (error) throw error
  return data
}

export async function creerAgent({ id, nom_complet, matricule, role, equipe_id, actif, superviseur_id }) {
  const { error } = await supabase
    .from('profils_planning')
    .insert({ id, nom_complet, matricule, role, equipe_id, actif, superviseur_id: superviseur_id || null })
  if (error) throw error
}

export async function modifierAgent(id, { nom_complet, matricule, role, equipe_id, actif, superviseur_id }) {
  const { error } = await supabase
    .from('profils_planning')
    .update({ nom_complet, matricule, role, equipe_id, actif, superviseur_id: superviseur_id || null })
    .eq('id', id)
  if (error) throw error
}

export async function supprimerAgent(id) {
  const { error } = await supabase.from('profils_planning').delete().eq('id', id)
  if (error) throw error
}
