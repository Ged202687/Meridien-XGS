import DayTimeline from './DayTimeline'
import { LIBELLE_STATUT } from '../lib/dateUtils'
import './AgentPlanningTable.css'

export default function AgentPlanningTable({ agents, plannings, date, agentDeplie, setAgentDeplie, colonneEquipe, editable, onEdit }) {
  const nbColonnes = 2 + (colonneEquipe ? 1 : 0) + 1 + (editable ? 1 : 0) // nom+role (+equipe) +statut (+modifier)
  const classeGrille = `agent-planning-ligne cols-${nbColonnes}`

  return (
    <div className="agent-planning-table">
      <div className={`${classeGrille} agent-planning-entete`}>
        <span>Nom</span>
        <span className="col-secondaire">Rôle</span>
        {colonneEquipe && <span className="col-secondaire">Équipe</span>}
        <span>Statut du jour</span>
        {editable && <span></span>}
      </div>
      {agents.map((a) => {
        const p = plannings[a.id]
        const deplie = agentDeplie === a.id
        return (
          <div key={a.id}>
            <div
              className={`${classeGrille}${deplie ? ' deplie' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={deplie}
              onClick={() => setAgentDeplie(deplie ? null : a.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
                e.preventDefault()
                setAgentDeplie(deplie ? null : a.id)
              }}
            >
              <span className="agent-planning-nom">{a.nom_complet}</span>
              <span className="muted col-secondaire">{a.role}</span>
              {colonneEquipe && <span className="muted col-secondaire">{a.equipe?.nom || '—'}</span>}
              <span>
                {!p && <span className="agent-planning-badge neutre">Non planifié</span>}
                {(p?.statut === 'travail' || p?.statut === 'formation') && (
                  <span className="muted">
                    {p.statut === 'formation' && 'Formation '}
                    {p.heure_debut?.slice(0, 5)} — {p.heure_fin?.slice(0, 5)}
                  </span>
                )}
                {p && p.statut !== 'travail' && p.statut !== 'formation' && (
                  <span
                    className={`agent-planning-badge ${
                      p.statut === 'repos_fixe' ? 'fixe' : p.statut === 'repos_rotatif' ? 'rotatif' : 'neutre'
                    }`}
                  >
                    {LIBELLE_STATUT[p.statut]}
                  </span>
                )}
              </span>
              {editable && (
                <span className="agent-planning-actions">
                  <button
                    type="button"
                    className="agent-planning-modifier"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(a, p)
                    }}
                  >
                    Modifier
                  </button>
                </span>
              )}
            </div>
            {deplie && (
              <div className="agent-planning-detail">
                <DayTimeline agentId={a.id} date={date} />
              </div>
            )}
          </div>
        )
      })}
      {agents.length === 0 && <p className="agent-planning-vide">Aucun agent à afficher.</p>}
    </div>
  )
}
