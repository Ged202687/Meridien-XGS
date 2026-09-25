import { supabase } from './supabaseClient'
import { formatDateISO } from './dateUtils'

export async function chargerShift(agentId, date) {
  const { data, error } = await supabase.rpc('shift_resume', {
    p_agent_id: agentId,
    p_date: formatDateISO(date),
  })
  if (error) throw error
  return data
}

export async function validerShift(planningId) {
  const { data, error } = await supabase.rpc('valider_shift', { p_planning_id: planningId })
  if (error) throw error
  return data
}

export async function devaliderShift(planningId) {
  const { data, error } = await supabase.rpc('devalider_shift', { p_planning_id: planningId })
  if (error) throw error
  return data
}
