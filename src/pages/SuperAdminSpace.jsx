import { useState } from 'react'
import GestionAgents from '../components/GestionAgents'
import ValidationSwaps from '../components/ValidationSwaps'
import GlobalPlanning from '../components/GlobalPlanning'

export default function SuperAdminSpace({ profil }) {
  const [onglet, setOnglet] = useState('planning')

  return (
    <div className="meridien-page">
      <h1 className="meridien-page-title">Super admin</h1>

      <div className="meridien-switch">
        <button className={onglet === 'planning' ? 'active' : ''} onClick={() => setOnglet('planning')}>
          Planning global
        </button>
        <button className={onglet === 'agents' ? 'active' : ''} onClick={() => setOnglet('agents')}>
          Gestion des agents
        </button>
        <button className={onglet === 'swaps' ? 'active' : ''} onClick={() => setOnglet('swaps')}>
          Demandes d'échange
        </button>
      </div>

      {onglet === 'planning' && <GlobalPlanning />}
      {onglet === 'agents' && <GestionAgents />}
      {onglet === 'swaps' && <ValidationSwaps />}
    </div>
  )
}
