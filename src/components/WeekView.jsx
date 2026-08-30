import { usePlanningSemaine } from '../lib/usePlanningSemaine'
import { LIBELLE_STATUT } from '../lib/dateUtils'
import './WeekView.css'

const JOURS_COURTS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function WeekView({ agentId, lundi, onChoisirJour }) {
  const { jours, chargement, erreur } = usePlanningSemaine(agentId, lundi)

  if (chargement) return <p className="week-view-info">Chargement…</p>
  if (erreur) return <p className="week-view-erreur">Impossible de charger la semaine.</p>

  return (
    <div className="week-view">
      {jours.map(({ date, planning }, i) => {
        const estRepos = planning && planning.statut !== 'travail' && planning.statut !== 'formation'
        const nonPlanifie = !planning
        return (
          <div
            key={i}
            className="week-view-ligne"
            onClick={() => onChoisirJour?.(date)}
          >
            <span>{JOURS_COURTS[i]} {date.getDate()}</span>
            {nonPlanifie && <span className="week-view-badge badge-neutre">Non planifié</span>}
            {(planning?.statut === 'travail' || planning?.statut === 'formation') && (
              <span className="week-view-heures">
                {planning.statut === 'formation' && 'Formation '}
                {planning.heure_debut?.slice(0, 5)} — {planning.heure_fin?.slice(0, 5)}
              </span>
            )}
            {estRepos && (
              <span
                className={`week-view-badge ${
                  planning.statut === 'repos_fixe' ? 'badge-fixe' : 'badge-rotatif'
                }`}
              >
                {LIBELLE_STATUT[planning.statut]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
