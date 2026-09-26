import { useState } from 'react'
import DayTimeline from './DayTimeline'
import WeekView from './WeekView'
import MonthView from './MonthView'
import {
  ajouterJours,
  ajouterSemaines,
  ajouterMois,
  lundiDeSemaine,
  formatDateLongue,
  formatDateCourte,
  formatMoisAnnee,
} from '../lib/dateUtils'
import { IconePrecedent, IconeSuivant } from './Icones'
import './PlanningTabs.css'

const ONGLETS = [
  { id: 'jour', label: 'Jour' },
  { id: 'semaine', label: 'Semaine' },
  { id: 'mois', label: 'Mois' },
]

export default function PlanningTabs({ agentId, nomAgent, editable }) {
  const [actif, setActif] = useState('jour')
  const [date, setDate] = useState(new Date())

  function allerAuJour(jour) {
    setDate(jour)
    setActif('jour')
  }

  const lundi = lundiDeSemaine(date)

  let sousTitre = 'Planning'
  if (actif === 'jour') sousTitre = formatDateLongue(date)
  if (actif === 'semaine') {
    sousTitre = `Semaine du ${formatDateCourte(lundi)} au ${formatDateCourte(ajouterJours(lundi, 6))}`
  }
  if (actif === 'mois') sousTitre = formatMoisAnnee(date)

  return (
    <div className="planning-tabs">
      <div className="planning-tabs-header">
        <div>
          <p className="planning-tabs-nom">{nomAgent}</p>
          <p className="planning-tabs-sous-titre">{sousTitre}</p>
        </div>
        <div className="planning-tabs-switch">
          {ONGLETS.map((onglet) => (
            <button
              type="button"
              key={onglet.id}
              className={onglet.id === actif ? 'active' : ''}
              aria-pressed={onglet.id === actif}
              onClick={() => setActif(onglet.id)}
            >
              {onglet.label}
            </button>
          ))}
        </div>
      </div>

      <div className="planning-tabs-nav-jour">
        {actif === 'jour' && (
          <>
            <button type="button" aria-label="Jour précédent" onClick={() => setDate((d) => ajouterJours(d, -1))}><IconePrecedent /></button>
            <button type="button" onClick={() => setDate(new Date())}>Aujourd'hui</button>
            <button type="button" aria-label="Jour suivant" onClick={() => setDate((d) => ajouterJours(d, 1))}><IconeSuivant /></button>
          </>
        )}
        {actif === 'semaine' && (
          <>
            <button type="button" aria-label="Semaine précédente" onClick={() => setDate((d) => ajouterSemaines(d, -1))}><IconePrecedent /></button>
            <button type="button" onClick={() => setDate(new Date())}>Cette semaine</button>
            <button type="button" aria-label="Semaine suivante" onClick={() => setDate((d) => ajouterSemaines(d, 1))}><IconeSuivant /></button>
          </>
        )}
        {actif === 'mois' && (
          <>
            <button type="button" aria-label="Mois précédent" onClick={() => setDate((d) => ajouterMois(d, -1))}><IconePrecedent /></button>
            <button type="button" onClick={() => setDate(new Date())}>Ce mois-ci</button>
            <button type="button" aria-label="Mois suivant" onClick={() => setDate((d) => ajouterMois(d, 1))}><IconeSuivant /></button>
          </>
        )}
      </div>

      <div className="planning-tabs-contenu">
        {actif === 'jour' && (
          <DayTimeline agentId={agentId} nomAgent={nomAgent} date={date} editable={editable} />
        )}
        {actif === 'semaine' && (
          <WeekView agentId={agentId} lundi={lundi} onChoisirJour={allerAuJour} />
        )}
        {actif === 'mois' && (
          <MonthView agentId={agentId} mois={date} onChoisirJour={allerAuJour} />
        )}
      </div>
    </div>
  )
}
