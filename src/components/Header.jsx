import { supabase } from '../lib/supabaseClient'
import MeridienMark from './MeridienMark'
import NotificationsBell from './NotificationsBell'
import './Header.css'

const LIBELLE_ROLE = {
  agent: 'Agent',
  coach: 'Coach',
  superviseur: 'Superviseur',
  super_admin: 'Super admin',
}

export default function Header({ profil }) {
  async function seDeconnecter() {
    await supabase.auth.signOut()
  }

  return (
    <header className="meridien-header">
      <div className="meridien-header-brand">
        <MeridienMark size={28} />
        <span>Méridien</span>
      </div>

      <div className="meridien-header-user">
        <NotificationsBell profilId={profil?.id} />
        <span className="meridien-header-name">{profil?.nom_complet}</span>
        <span className="meridien-header-role">{LIBELLE_ROLE[profil?.role] ?? profil?.role}</span>
        <button className="meridien-header-logout" onClick={seDeconnecter}>
          Se déconnecter
        </button>
      </div>
    </header>
  )
}
