import { supabase } from '../lib/supabaseClient'
import MeridienMark from './MeridienMark'
import NotificationsBell from './NotificationsBell'
import { IconeSortie } from './Icones'
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
        <MeridienMark size={30} />
        <div>
          <span className="meridien-header-nom">Méridien</span>
          <span className="meridien-header-sous-titre">Planning des agents · XGS</span>
        </div>
      </div>

      <div className="meridien-header-user">
        <NotificationsBell profilId={profil?.id} />
        <div className="meridien-header-qui">
          <span className="meridien-header-name">{profil?.nom_complet}</span>
          <span className="meridien-header-role">{LIBELLE_ROLE[profil?.role] ?? profil?.role}</span>
        </div>
        <button type="button" className="meridien-header-logout" onClick={seDeconnecter} title="Se déconnecter">
          <IconeSortie taille={15} />
          <span className="meridien-header-logout-texte">Se déconnecter</span>
        </button>
      </div>
    </header>
  )
}
