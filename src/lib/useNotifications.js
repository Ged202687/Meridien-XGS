import { supabase } from './supabaseClient'

export async function listerNotifications(profilId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('destinataire_id', profilId)
    .order('cree_le', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function marquerNotificationLue(id) {
  const { error } = await supabase.from('notifications').update({ lu: true }).eq('id', id)
  if (error) throw error
}
