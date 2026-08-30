import { useEffect, useState } from 'react'
import {
  listerMesJoursTravailles,
  listerCandidatsPourDate,
  creerDemandeSwap,
  listerMesDemandesSwap,
} from '../lib/useDemandesSwap'
import { lundiDeSemaine, ajouterSemaines, formatDateCourte, formatDateLongue } from '../lib/dateUtils'
import './DemandeSwap.css'
import './DemandeSwap.css'

const LIBELLE_STATUT_DEMANDE = {
  en_attente: 'En attente',
  validee: 'Validée',
  refusee: 'Refusée',
}

export default function DemandeSwap({ profil }) {
  const [lundi, setLundi] = useState(lundiDeSemaine(new Date()))
  const [joursTravailles, setJoursTravailles] = useState([])
  const [jourChoisi, setJourChoisi] = useState(null)
  const [candidats, setCandidats] = useState([])
  const [candidatChoisi, setCandidatChoisi] = useState(null)
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState(null)
  const [mesDemandes, setMesDemandes] = useState([])

  useEffect(() => {
    setJourChoisi(null)
    setCandidatChoisi(null)
    setCandidats([])
    listerMesJoursTravailles(profil.id, lundi).then(setJoursTravailles)
  }, [profil.id, lundi])

  useEffect(() => {
    if (!jourChoisi) return
    setCandidatChoisi(null)
    listerCandidatsPourDate(profil.id, jourChoisi.date).then(setCandidats)
  }, [jourChoisi, profil.id])

  function rechargerMesDemandes() {
    listerMesDemandesSwap(profil.id).then(setMesDemandes)
  }

  useEffect(() => {
    rechargerMesDemandes()
  }, [profil.id])

  async function envoyerDemande() {
    setMessage(null)
    setEnvoi(true)
    try {
      await creerDemandeSwap({
        demandeurId: profil.id,
        planningDemandeurId: jourChoisi.id,
        agentCibleId: candidatChoisi.agent_id,
        planningCibleId: candidatChoisi.id,
        motif,
      })
      setMessage({ type: 'succes', texte: 'Demande envoyée, en attente de validation par le super admin.' })
      setJourChoisi(null)
      setCandidatChoisi(null)
      setMotif('')
      rechargerMesDemandes()
    } catch (err) {
      const texte = err.message?.includes('row-level security')
        ? "Ce jour est trop proche (moins de 48h) — l'échange n'est plus possible."
        : err.message ?? 'Envoi impossible.'
      setMessage({ type: 'erreur', texte })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="demande-swap">
      <div className="demande-swap-section">
        <p className="demande-swap-titre">1. Quel jour voulez-vous avoir off ?</p>
        <p className="demande-swap-note">Les demandes doivent être faites au moins 48h à l'avance.</p>
        <div className="demande-swap-semaine-nav">
          <button onClick={() => setLundi((l) => ajouterSemaines(l, -1))}>←</button>
          <span>Semaine du {formatDateCourte(lundi)}</span>
          <button onClick={() => setLundi((l) => ajouterSemaines(l, 1))}>→</button>
        </div>

        {joursTravailles.length === 0 && (
          <p className="demande-swap-vide">
            Aucun jour éligible cette semaine (soit rien de travaillé, soit tous les jours sont à
            moins de 48h).
          </p>
        )}

        <div className="demande-swap-liste">
          {joursTravailles.map((j) => (
            <button
              key={j.id}
              className={jourChoisi?.id === j.id ? 'choisi' : ''}
              onClick={() => setJourChoisi(j)}
            >
              {formatDateLongue(new Date(j.date))}
            </button>
          ))}
        </div>
      </div>

      {jourChoisi && (
        <div className="demande-swap-section">
          <p className="demande-swap-titre">2. Avec quel collègue échanger ?</p>
          {candidats.length === 0 && (
            <p className="demande-swap-vide">Aucun collègue n'est en repos ce jour-là pour l'instant.</p>
          )}
          <div className="demande-swap-liste">
            {candidats.map((c) => (
              <button
                key={c.id}
                className={candidatChoisi?.id === c.id ? 'choisi' : ''}
                onClick={() => setCandidatChoisi(c)}
              >
                {c.agent.nom_complet}
              </button>
            ))}
          </div>
        </div>
      )}

      {candidatChoisi && (
        <div className="demande-swap-section">
          <p className="demande-swap-titre">3. Motif (facultatif)</p>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="ex. rendez-vous personnel"
          />
          {message && <p className={`demande-swap-message ${message.type}`}>{message.texte}</p>}
          <button className="demande-swap-envoyer" onClick={envoyerDemande} disabled={envoi}>
            {envoi ? 'Envoi…' : "Envoyer la demande"}
          </button>
        </div>
      )}

      <div className="demande-swap-section">
        <p className="demande-swap-titre">Mes demandes</p>
        {mesDemandes.length === 0 && <p className="demande-swap-vide">Aucune demande pour le moment.</p>}
        <div className="demande-swap-historique">
          {mesDemandes.map((d) => (
            <div key={d.id} className="demande-swap-ligne">
              <span>
                {d.planning_demandeur?.date} ↔ {d.cible?.nom_complet} ({d.planning_cible?.date})
              </span>
              <span className={`demande-swap-statut ${d.statut}`}>
                {LIBELLE_STATUT_DEMANDE[d.statut]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
