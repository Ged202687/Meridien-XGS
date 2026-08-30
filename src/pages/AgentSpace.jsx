import { useState } from 'react'
import PlanningTabs from '../components/PlanningTabs'
import DemandeSwap from '../components/DemandeSwap'

export default function AgentSpace({ profil }) {
  const [vue, setVue] = useState('planning')

  return (
    <div className="meridien-page">
      <h1 className="meridien-page-title">Mon espace</h1>

      <div className="meridien-switch">
        <button className={vue === 'planning' ? 'active' : ''} onClick={() => setVue('planning')}>
          Mon planning
        </button>
        <button className={vue === 'swap' ? 'active' : ''} onClick={() => setVue('swap')}>
          Demander un échange
        </button>
      </div>

      {vue === 'planning' && <PlanningTabs agentId={profil.id} nomAgent={profil.nom_complet} />}
      {vue === 'swap' && <DemandeSwap profil={profil} />}
    </div>
  )
}
