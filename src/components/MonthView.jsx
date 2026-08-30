import { usePlanningMois } from '../lib/usePlanningMois'
import './MonthView.css'

const JOURS_ENTETE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function MonthView({ agentId, mois, onChoisirJour }) {
  const { semaines, chargement, erreur } = usePlanningMois(agentId, mois)

  if (chargement) return <p className="month-view-info">Chargement…</p>
  if (erreur) return <p className="month-view-erreur">Impossible de charger le mois.</p>

  return (
    <div>
      <div className="month-view-entete">
        {JOURS_ENTETE.map((j) => (
          <span key={j}>{j}</span>
        ))}
      </div>
      <div className="month-view-grille">
        {semaines.flat().map(({ date, planning, horsMois }, i) => {
          const estRepos = planning && planning.statut !== 'travail' && planning.statut !== 'formation'
          return (
            <div
              key={i}
              className={`month-view-case ${horsMois ? 'hors-mois' : ''} ${
                estRepos ? (planning.statut === 'repos_fixe' ? 'fixe' : 'rotatif') : ''
              }`}
              onClick={() => onChoisirJour?.(date)}
            >
              <span className="month-view-numero">{date.getDate()}</span>
              <span className="month-view-detail">
                {!planning && '—'}
                {planning?.statut === 'travail' &&
                  `${planning.heure_debut?.slice(0, 5)}-${planning.heure_fin?.slice(0, 5)}`}
                {planning?.statut === 'formation' && 'Formation'}
                {estRepos && 'Repos'}
              </span>
            </div>
          )
        })}
      </div>
      <div className="month-view-legende">
        <span><i className="pastille-mois neutre" /> Travaillé</span>
        <span><i className="pastille-mois fixe" /> Repos fixe (dimanche)</span>
        <span><i className="pastille-mois rotatif" /> Repos rotatif</span>
      </div>
    </div>
  )
}
