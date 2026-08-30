import { useEffect, useState } from 'react'
import { listerModelesHoraire, enregistrerPlanningJour } from '../lib/useEditionPlanning'
import { formatDateLongue } from '../lib/dateUtils'
import './EditPlanningModal.css'

const STATUTS = [
  { id: 'travail', label: 'Travail' },
  { id: 'repos_fixe', label: 'Repos fixe' },
  { id: 'repos_rotatif', label: 'Repos rotatif' },
  { id: 'conge', label: 'Congé' },
  { id: 'absence', label: 'Absence' },
]

export default function EditPlanningModal({ agent, date, planningActuel, onFerme, onEnregistre }) {
  const [statut, setStatut] = useState(planningActuel?.statut ?? 'travail')
  const [modeleId, setModeleId] = useState(planningActuel?.modele_horaire_id ?? '')
  const [modeles, setModeles] = useState([])
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    listerModelesHoraire().then(setModeles)
  }, [])

  useEffect(() => {
    if (!modeleId && modeles.length > 0 && statut === 'travail') {
      setModeleId(modeles[0].id)
    }
  }, [modeles, statut, modeleId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur(null)

    if (statut === 'travail' && !modeleId) {
      setErreur('Choisissez un horaire.')
      return
    }

    setEnregistrement(true)
    try {
      const modele = modeles.find((m) => m.id === modeleId)
      await enregistrerPlanningJour({
        agentId: agent.id,
        date,
        statut,
        modeleHoraireId: statut === 'travail' ? modeleId : null,
        heureDebut: statut === 'travail' ? modele.heure_debut : null,
        heureFin: statut === 'travail' ? modele.heure_fin : null,
      })
      onEnregistre()
    } catch (err) {
      setErreur(err.message ?? 'Enregistrement impossible.')
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="edit-planning-overlay">
      <div className="edit-planning-modal">
        <h2>Modifier le planning</h2>
        <p className="edit-planning-sujet">
          {agent.nom_complet} — {formatDateLongue(date)}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="edit-planning-field">
            <label>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}>
              {STATUTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {statut === 'travail' && (
            <div className="edit-planning-field">
              <label>Horaire</label>
              <select value={modeleId} onChange={(e) => setModeleId(e.target.value)}>
                {modeles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.libelle} ({m.heure_debut.slice(0, 5)}-{m.heure_fin.slice(0, 5)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {erreur && <p className="edit-planning-erreur">{erreur}</p>}

          <div className="edit-planning-actions">
            <button type="button" onClick={onFerme}>
              Annuler
            </button>
            <button type="submit" className="edit-planning-enregistrer" disabled={enregistrement}>
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
