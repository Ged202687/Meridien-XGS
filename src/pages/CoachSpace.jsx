import { useState } from 'react'
import PlanningTabs from '../components/PlanningTabs'
import DemandeSwap from '../components/DemandeSwap'
import TeamView from '../components/TeamView'

export default function CoachSpace({ profil }) {
  const [vue, setVue] = useState('perso')

  return (
    <div className="meridien-page">
      <h1 className="meridien-page-title">Espace coach</h1>

      <div className="meridien-switch">
        <button className={vue === 'perso' ? 'active' : ''} onClick={() => setVue('perso')}>
          Mon planning
        </button>
        <button className={vue === 'equipe' ? 'active' : ''} onClick={() => setVue('equipe')}>
          Mon équipe
        </button>
        <button className={vue === 'swap' ? 'active' : ''} onClick={() => setVue('swap')}>
          Demander un échange
        </button>
      </div>

      {vue === 'perso' && <PlanningTabs agentId={profil.id} nomAgent={profil.nom_complet} />}
      {vue === 'equipe' && <TeamView profil={profil} />}
      {vue === 'swap' && <DemandeSwap profil={profil} />}
    </div>
  )
}
