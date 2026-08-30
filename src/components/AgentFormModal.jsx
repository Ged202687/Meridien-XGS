import { useEffect, useState } from 'react'
import {
  creerAgent,
  modifierAgent,
  supprimerAgent,
  rechercherComptesAureoDisponibles,
  getGroupeWeekend,
  setGroupeWeekend,
} from '../lib/useAgents'
import './AgentFormModal.css'

const ROLES = [
  { id: 'agent', label: 'Agent' },
  { id: 'coach', label: 'Coach' },
  { id: 'superviseur', label: 'Superviseur' },
  { id: 'super_admin', label: 'Super admin' },
]

export default function AgentFormModal({ agent, equipes, superviseurs, onFerme, onEnregistre }) {
  const modeEdition = Boolean(agent)

  const [compteSelectionne, setCompteSelectionne] = useState(
    modeEdition ? { id: agent.id } : null
  )
  const [recherche, setRecherche] = useState('')
  const [resultatsRecherche, setResultatsRecherche] = useState([])

  const [nomComplet, setNomComplet] = useState(agent?.nom_complet ?? '')
  const [matricule, setMatricule] = useState(agent?.matricule ?? '')
  const [role, setRole] = useState(agent?.role ?? 'agent')
  const [equipeId, setEquipeId] = useState(agent?.equipe?.id ?? '')
  const [superviseurId, setSuperviseurId] = useState(agent?.superviseur_id ?? '')
  const [actif, setActif] = useState(agent?.actif ?? true)
  const [groupeWeekend, setGroupeWeekendLocal] = useState('')

  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    if (modeEdition) {
      getGroupeWeekend(agent.id).then((g) => setGroupeWeekendLocal(g ?? ''))
    }
  }, [modeEdition, agent])

  useEffect(() => {
    if (modeEdition || recherche.trim().length < 2) {
      setResultatsRecherche([])
      return
    }
    let annule = false
    rechercherComptesAureoDisponibles(recherche.trim()).then((res) => {
      if (!annule) setResultatsRecherche(res)
    })
    return () => {
      annule = true
    }
  }, [recherche, modeEdition])

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur(null)

    if (!modeEdition && !compteSelectionne) {
      setErreur('Sélectionnez un compte Auréo existant.')
      return
    }
    if (!nomComplet.trim()) {
      setErreur('Le nom complet est requis.')
      return
    }

    setEnregistrement(true)
    try {
      const payload = {
        nom_complet: nomComplet.trim(),
        matricule: matricule.trim() || null,
        role,
        equipe_id: equipeId || null,
        superviseur_id: role === 'coach' ? superviseurId || null : null,
        actif,
      }

      if (modeEdition) {
        await modifierAgent(agent.id, payload)
        if (groupeWeekend) await setGroupeWeekend(agent.id, groupeWeekend)
      } else {
        await creerAgent({ id: compteSelectionne.id, ...payload })
        if (groupeWeekend) await setGroupeWeekend(compteSelectionne.id, groupeWeekend)
      }
      onEnregistre()
    } catch (err) {
      setErreur(err.message ?? 'Une erreur est survenue.')
    } finally {
      setEnregistrement(false)
    }
  }

  async function handleSupprimer() {
    if (!confirm(`Supprimer ${agent.nom_complet} du planning ? Cette action est définitive.`)) return
    setEnregistrement(true)
    try {
      await supprimerAgent(agent.id)
      onEnregistre()
    } catch (err) {
      setErreur(err.message ?? 'Suppression impossible.')
      setEnregistrement(false)
    }
  }

  return (
    <div className="agent-modal-overlay">
      <div className="agent-modal">
        <h2>{modeEdition ? 'Modifier un agent' : 'Ajouter un agent'}</h2>

        {!modeEdition && !compteSelectionne && (
          <div className="agent-modal-field">
            <label>Compte Auréo (recherche par identifiant)</label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="ex. s.alex"
            />
            {resultatsRecherche.length > 0 && (
              <ul className="agent-modal-resultats">
                {resultatsRecherche.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setCompteSelectionne(c)}>
                      {c.login}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(modeEdition || compteSelectionne) && (
          <form onSubmit={handleSubmit}>
            {!modeEdition && (
              <p className="agent-modal-compte-choisi">
                Compte sélectionné : <strong>{compteSelectionne.login}</strong>
              </p>
            )}

            <div className="agent-modal-field">
              <label>Nom complet</label>
              <input value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} />
            </div>

            <div className="agent-modal-field">
              <label>Matricule</label>
              <input value={matricule} onChange={(e) => setMatricule(e.target.value)} />
            </div>

            <div className="agent-modal-row">
              <div className="agent-modal-field">
                <label>Rôle</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agent-modal-field">
                <label>Équipe</label>
                <select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
                  <option value="">—</option>
                  {equipes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role === 'coach' && (
              <div className="agent-modal-field">
                <label>Superviseur</label>
                <select value={superviseurId} onChange={(e) => setSuperviseurId(e.target.value)}>
                  <option value="">—</option>
                  {superviseurs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom_complet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="agent-modal-row">
              <div className="agent-modal-field">
                <label>Groupe week-end</label>
                <select value={groupeWeekend} onChange={(e) => setGroupeWeekendLocal(e.target.value)}>
                  <option value="">Automatique</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>

              <div className="agent-modal-field agent-modal-actif">
                <label>
                  <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
                  {' '}Compte actif
                </label>
              </div>
            </div>

            {erreur && <p className="agent-modal-erreur">{erreur}</p>}

            <div className="agent-modal-actions">
              {modeEdition && (
                <button type="button" className="agent-modal-supprimer" onClick={handleSupprimer}>
                  Supprimer
                </button>
              )}
              <div className="agent-modal-actions-droite">
                <button type="button" onClick={onFerme}>
                  Annuler
                </button>
                <button type="submit" className="agent-modal-enregistrer" disabled={enregistrement}>
                  {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </form>
        )}

        {!modeEdition && !compteSelectionne && (
          <div className="agent-modal-actions">
            <div />
            <button type="button" onClick={onFerme}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
