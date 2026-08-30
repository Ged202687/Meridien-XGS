import { usePlanningJour } from '../lib/usePlanningJour'
import { heureVersMinutes, LIBELLE_STATUT, LIBELLE_PAUSE } from '../lib/dateUtils'
import './DayTimeline.css'

export default function DayTimeline({ agentId, date }) {
  const { planning, pauses, chargement, erreur } = usePlanningJour(agentId, date)

  if (chargement) {
    return <p className="day-timeline-info">Chargement…</p>
  }

  if (erreur) {
    return <p className="day-timeline-erreur">Impossible de charger le planning de ce jour.</p>
  }

  if (!planning || planning.statut !== 'travail') {
    const libelle = planning ? LIBELLE_STATUT[planning.statut] : 'Non planifié'
    return <p className="day-timeline-repos">{libelle}</p>
  }

  const debut = heureVersMinutes(planning.heure_debut)
  const fin = heureVersMinutes(planning.heure_fin)
  const duree = fin - debut

  return (
    <div>
      <div className="day-timeline-bar">
        {pauses.map((pause) => {
          const pDebut = heureVersMinutes(pause.heure_debut)
          const pFin = heureVersMinutes(pause.heure_fin)
          const gauche = ((pDebut - debut) / duree) * 100
          const largeur = ((pFin - pDebut) / duree) * 100
          return (
            <div
              key={pause.id}
              className={`day-timeline-pause ${pause.type_pause === 'dejeuner' ? 'dejeuner' : 'pause15'}`}
              style={{ left: `${gauche}%`, width: `${largeur}%` }}
              title={`${LIBELLE_PAUSE[pause.type_pause]} — ${pause.heure_debut.slice(0, 5)} à ${pause.heure_fin.slice(0, 5)}`}
            />
          )
        })}
      </div>
      <div className="day-timeline-repere">
        <span>{planning.heure_debut.slice(0, 5)}</span>
        <span>{planning.heure_fin.slice(0, 5)}</span>
      </div>
      <div className="day-timeline-legende">
        <span><i className="pastille poste" /> Poste de travail</span>
        <span><i className="pastille pause15" /> Pause 15 min</span>
        <span><i className="pastille dejeuner" /> Déjeuner</span>
      </div>
    </div>
  )
}
