import { useEffect, useState } from 'react'
import { listerAgents } from '../lib/useAgents'
import { injecterFormation } from '../lib/useFormation'
import { formatDateISO } from '../lib/dateUtils'
import './InjecterFormation.css'

export default function InjecterFormation() {
  const [agents, setAgents] = useState([])
  const [recherche, setRecherche] = useState('')
  const [agentsChoisis, setAgentsChoisis] = useState([])
  const [dateDebut, setDateDebut] = useState(formatDateISO(new Date()))
  const [dateFin, setDateFin] = useState(formatDateISO(new Date()))
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('12:00')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    listerAgents().then(setAgents)
  }, [])

  function basculerAgent(id) {
    setAgentsChoisis((liste) => (liste.includes(id) ? liste.filter((a) => a !== id) : [...liste, id]))
  }

  const agentsFiltres = agents.filter((a) =>
    a.nom_complet.toLowerCase().includes(recherche.toLowerCase())
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (agentsChoisis.length === 0) {
      setMessage({ type: 'erreur', texte: 'Choisissez au moins un agent.' })
      return
    }
    if (dateFin < dateDebut) {
      setMessage({ type: 'erreur', texte: 'La date de fin doit être après la date de début.' })
      return
    }
    if (heureFin <= heureDebut) {
      setMessage({ type: 'erreur', texte: "L'heure de fin doit être après l'heure de début." })
      return
    }

    setEnvoi(true)
    try {
      const nb = await injecterFormation({
        agentIds: agentsChoisis,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        heureDebut,
        heureFin,
      })
      setMessage({ type: 'succes', texte: `Formation injectée sur ${nb} jour(s)/agent(s).` })
      setAgentsChoisis([])
    } catch (err) {
      setMessage({ type: 'erreur', texte: err.message ?? 'Injection impossible.' })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="injecter-formation" onSubmit={handleSubmit}>
      <div className="injecter-formation-section">
        <p className="injecter-formation-titre">1. Agents concernés ({agentsChoisis.length} sélectionné(s))</p>
        <input
          className="injecter-formation-recherche"
          placeholder="Rechercher un agent"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <div className="injecter-formation-liste-agents">
          {agentsFiltres.map((a) => (
            <label key={a.id} className="injecter-formation-agent">
              <input
                type="checkbox"
                checked={agentsChoisis.includes(a.id)}
                onChange={() => basculerAgent(a.id)}
              />
              {a.nom_complet}
            </label>
          ))}
        </div>
      </div>

      <div className="injecter-formation-section">
        <p className="injecter-formation-titre">2. Dates</p>
        <div className="injecter-formation-row">
          <div className="injecter-formation-champ">
            <label>Du</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          <div className="injecter-formation-champ">
            <label>Au</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="injecter-formation-section">
        <p className="injecter-formation-titre">3. Horaires de la formation</p>
        <div className="injecter-formation-row">
          <div className="injecter-formation-champ">
            <label>De</label>
            <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
          </div>
          <div className="injecter-formation-champ">
            <label>À</label>
            <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />
          </div>
        </div>
      </div>

      {message && <p className={`injecter-formation-message ${message.type}`}>{message.texte}</p>}

      <button className="injecter-formation-envoyer" type="submit" disabled={envoi}>
        {envoi ? 'Injection…' : 'Injecter la formation'}
      </button>

      <p className="injecter-formation-note">
        Remplace le statut du jour pour chaque agent choisi (écrase un jour déjà travaillé, repos
        rotatif ou congé sur cette période) et retire les pauses calculées automatiquement pour ces
        jours.
      </p>
    </form>
  )
}
