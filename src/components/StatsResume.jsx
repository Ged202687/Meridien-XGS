import './StatsResume.css'

export default function StatsResume({ agents, plannings }) {
  let enPoste = 0
  let enRepos = 0
  let nonPlanifie = 0

  agents.forEach((a) => {
    const p = plannings[a.id]
    if (!p) nonPlanifie += 1
    else if (p.statut === 'travail') enPoste += 1
    else enRepos += 1
  })

  return (
    <div className="stats-resume">
      <div className="stats-resume-item">
        <span className="stats-resume-valeur">{enPoste}</span>
        <span className="stats-resume-label">En poste</span>
      </div>
      <div className="stats-resume-item">
        <span className="stats-resume-valeur">{enRepos}</span>
        <span className="stats-resume-label">En repos</span>
      </div>
      {nonPlanifie > 0 && (
        <div className="stats-resume-item stats-resume-muted">
          <span className="stats-resume-valeur">{nonPlanifie}</span>
          <span className="stats-resume-label">Non planifié</span>
        </div>
      )}
    </div>
  )
}
