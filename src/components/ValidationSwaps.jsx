import { useEffect, useState } from 'react'
import { listerDemandesSwapAdmin, traiterDemandeSwap } from '../lib/useDemandesSwap'
import './ValidationSwaps.css'

const LIBELLE_STATUT = {
  en_attente: 'En attente',
  validee: 'Validée',
  refusee: 'Refusée',
}

export default function ValidationSwaps() {
  const [filtre, setFiltre] = useState('en_attente')
  const [demandes, setDemandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [enTraitement, setEnTraitement] = useState(null)

  async function recharger() {
    setChargement(true)
    try {
      const data = await listerDemandesSwapAdmin(filtre || null)
      setDemandes(data)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    recharger()
  }, [filtre])

  async function traiter(id, valider) {
    setEnTraitement(id)
    setErreur(null)
    try {
      await traiterDemandeSwap(id, valider)
      recharger()
    } catch (err) {
      setErreur(err.message ?? 'Traitement impossible.')
    } finally {
      setEnTraitement(null)
    }
  }

  return (
    <div>
      <div className="validation-swaps-filtres">
        {[
          { id: 'en_attente', label: 'En attente' },
          { id: 'validee', label: 'Validées' },
          { id: 'refusee', label: 'Refusées' },
          { id: '', label: 'Toutes' },
        ].map((f) => (
          <button
            key={f.id}
            className={filtre === f.id ? 'active' : ''}
            onClick={() => setFiltre(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {chargement && <p className="validation-swaps-info">Chargement…</p>}
      {erreur && <p className="validation-swaps-erreur">{erreur}</p>}

      {!chargement && demandes.length === 0 && (
        <p className="validation-swaps-info">Aucune demande dans cette catégorie.</p>
      )}

      <div className="validation-swaps-liste">
        {demandes.map((d) => (
          <div className="validation-swaps-carte" key={d.id}>
            <div className="validation-swaps-corps">
              <p className="validation-swaps-titre">
                {d.demandeur?.nom_complet} veut le {d.planning_demandeur?.date} off
              </p>
              <p className="validation-swaps-detail">
                En échange avec {d.cible?.nom_complet} ({d.planning_cible?.date})
              </p>
              {d.motif && <p className="validation-swaps-motif">« {d.motif} »</p>}
            </div>

            <div className="validation-swaps-actions">
              <span className={`validation-swaps-statut ${d.statut}`}>
                {LIBELLE_STATUT[d.statut]}
              </span>
              {d.statut === 'en_attente' && (
                <div className="validation-swaps-boutons">
                  <button
                    className="valider"
                    disabled={enTraitement === d.id}
                    onClick={() => traiter(d.id, true)}
                  >
                    Valider
                  </button>
                  <button
                    className="refuser"
                    disabled={enTraitement === d.id}
                    onClick={() => traiter(d.id, false)}
                  >
                    Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
