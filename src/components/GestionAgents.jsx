import { useEffect, useState } from 'react'
import { listerAgents, listerEquipes } from '../lib/useAgents'
import AgentFormModal from './AgentFormModal'
import './GestionAgents.css'

const LIBELLE_ROLE = {
  agent: 'Agent',
  coach: 'Coach',
  superviseur: 'Superviseur',
  super_admin: 'Super admin',
}

export default function GestionAgents() {
  const [agents, setAgents] = useState([])
  const [equipes, setEquipes] = useState([])
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [modal, setModal] = useState(null) // null | 'creation' | agent à éditer

  async function recharger() {
    setChargement(true)
    try {
      const [ag, eq] = await Promise.all([listerAgents(), listerEquipes()])
      setAgents(ag)
      setEquipes(eq)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    recharger()
  }, [])

  const agentsFiltres = agents.filter((a) => {
    const correspondRecherche =
      !recherche ||
      a.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
      (a.matricule ?? '').toLowerCase().includes(recherche.toLowerCase())
    const correspondRole = !filtreRole || a.role === filtreRole
    return correspondRecherche && correspondRole
  })

  return (
    <div>
      <div className="gestion-agents-toolbar">
        <p className="gestion-agents-titre">Gestion des agents</p>
        <button className="gestion-agents-ajouter" onClick={() => setModal('creation')}>
          + Ajouter un agent
        </button>
      </div>

      <div className="gestion-agents-filtres">
        <input
          placeholder="Rechercher un agent"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(LIBELLE_ROLE).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {chargement && <p className="gestion-agents-info">Chargement…</p>}
      {erreur && <p className="gestion-agents-erreur">{erreur}</p>}

      {!chargement && !erreur && (
        <div className="gestion-agents-table">
          <div className="gestion-agents-ligne gestion-agents-entete">
            <span>Nom</span>
            <span>Matricule</span>
            <span>Rôle</span>
            <span>Équipe</span>
            <span>Statut</span>
            <span></span>
          </div>
          {agentsFiltres.map((a) => (
            <div className="gestion-agents-ligne" key={a.id}>
              <span>{a.nom_complet}</span>
              <span className="muted">{a.matricule || '—'}</span>
              <span>{LIBELLE_ROLE[a.role] ?? a.role}</span>
              <span className="muted">{a.equipe?.nom || '—'}</span>
              <span>
                <span className={`badge ${a.actif ? 'badge-actif' : 'badge-inactif'}`}>
                  {a.actif ? 'Actif' : 'Inactif'}
                </span>
              </span>
              <span className="gestion-agents-modifier" onClick={() => setModal(a)}>
                Modifier
              </span>
            </div>
          ))}
          {agentsFiltres.length === 0 && (
            <p className="gestion-agents-info">Aucun agent ne correspond à ces critères.</p>
          )}
        </div>
      )}

      {modal && (
        <AgentFormModal
          agent={modal === 'creation' ? null : modal}
          equipes={equipes}
          superviseurs={agents.filter((a) => a.role === 'superviseur')}
          onFerme={() => setModal(null)}
          onEnregistre={() => {
            setModal(null)
            recharger()
          }}
        />
      )}
    </div>
  )
}
