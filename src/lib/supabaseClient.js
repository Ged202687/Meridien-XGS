import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Aide au diagnostic si le fichier .env.local n'a pas été renseigné
  console.error(
    'Variables Supabase manquantes : copiez .env.example vers .env.local et renseignez vos identifiants.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
