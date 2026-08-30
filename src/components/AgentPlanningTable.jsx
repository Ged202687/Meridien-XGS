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
        <span>Rôle</span>
        {colonneEquipe && <span>Équipe</span>}
        <span>Statut du jour</span>
        {editable && <span></span>}
      </div>
      {agents.map((a) => {
        const p = plannings[a.id]
        const deplie = agentDeplie === a.id
        return (
          <div key={a.id}>
            <div className={classeGrille} onClick={() => setAgentDeplie(deplie ? null : a.id)}>
              <span>{a.nom_complet}</span>
              <span className="muted">{a.role}</span>
              {colonneEquipe && <span className="muted">{a.equipe?.nom || '—'}</span>}
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
                <span
                  className="agent-planning-modifier"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(a, p)
                  }}
                >
                  Modifier
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
