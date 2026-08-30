import { useState } from 'react'
import { usePlanningJour } from '../lib/usePlanningJour'
import { heureVersMinutes, LIBELLE_STATUT, LIBELLE_PAUSE, formatDateISO } from '../lib/dateUtils'
import EditPlanningModal from './EditPlanningModal'
import './DayTimeline.css'

function estAujourdhui(date) {
  return formatDateISO(date) === formatDateISO(new Date())
}

function minutesMaintenant() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

export default function DayTimeline({ agentId, nomAgent, date, editable }) {
  const { planning, pauses, chargement, erreur, recharger } = usePlanningJour(agentId, date)
  const [edition, setEdition] = useState(false)

  if (chargement) {
    return <p className="day-timeline-info">Chargement…</p>
  }

  if (erreur) {
    return <p className="day-timeline-erreur">Impossible de charger le planning de ce jour.</p>
  }

  const boutonModifier = editable && (
    <button className="day-timeline-modifier" onClick={() => setEdition(true)}>
      Modifier ce jour
    </button>
  )

  const modal = edition && (
    <EditPlanningModal
      agent={{ id: agentId, nom_complet: nomAgent }}
      date={date}
      planningActuel={planning}
      onFerme={() => setEdition(false)}
      onEnregistre={() => {
        setEdition(false)
        recharger()
      }}
    />
  )

  if (!planning || planning.statut !== 'travail') {
    const libelle = planning ? LIBELLE_STATUT[planning.statut] : 'Non planifié'
    return (
      <div>
        <p className="day-timeline-repos">{libelle}</p>
        {boutonModifier}
        {modal}
      </div>
    )
  }

  const debut = heureVersMinutes(planning.heure_debut)
  const fin = heureVersMinutes(planning.heure_fin)
  const duree = fin - debut

  const heureActuelle = minutesMaintenant()
  const afficherHeureActuelle = estAujourdhui(date) && heureActuelle >= debut && heureActuelle <= fin
  const positionActuelle = ((heureActuelle - debut) / duree) * 100

  return (
    <div className="day-timeline-layout">
      <div className="day-timeline-heures">
        <span>{planning.heure_debut.slice(0, 5)}</span>
        <span>{planning.heure_fin.slice(0, 5)}</span>
      </div>

      <div className="day-timeline-bar-vertical">
        {pauses.map((pause) => {
          const pDebut = heureVersMinutes(pause.heure_debut)
          const pFin = heureVersMinutes(pause.heure_fin)
          const haut = ((pDebut - debut) / duree) * 100
          const hauteur = ((pFin - pDebut) / duree) * 100
          return (
            <div
              key={pause.id}
              className={`day-timeline-pause-v ${pause.type_pause === 'dejeuner' ? 'dejeuner' : 'pause15'}`}
              style={{ top: `${haut}%`, height: `${hauteur}%` }}
              title={`${LIBELLE_PAUSE[pause.type_pause]} — ${pause.heure_debut.slice(0, 5)} à ${pause.heure_fin.slice(0, 5)}`}
            />
          )
        })}
        {afficherHeureActuelle && (
          <div className="day-timeline-maintenant" style={{ top: `${positionActuelle}%` }} />
        )}
      </div>

      <div className="day-timeline-legende-v">
        <span><i className="pastille dejeuner" /> Déjeuner</span>
        <span><i className="pastille pause15" /> Pause 15 min</span>
        {afficherHeureActuelle && <span><i className="pastille maintenant" /> Heure actuelle</span>}
      </div>

      {boutonModifier}
      {modal}
    </div>
  )
}
