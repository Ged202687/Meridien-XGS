import { useEffect, useState } from 'react'
import ShiftProgressBar from './ShiftProgressBar'
import { chargerShift, validerShift, devaliderShift } from '../lib/useShift'
import { formatDateISO } from '../lib/dateUtils'
import { formatDuree, formatHeure, formatJourHeure } from '../lib/shiftFormat'
import './ShiftBilan.css'

export default function ShiftBilan({ agentId, date, onVerrouChange }) {
  const estFutur = formatDateISO(date) > formatDateISO(new Date())
  const [resume, setResume] = useState(null)
  const [chargement, setChargement] = useState(!estFutur)
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [erreurAction, setErreurAction] = useState(null)

  useEffect(() => {
    setResume(null)
    setErreur(null)
    setErreurAction(null)
    if (estFutur || !agentId) {
      setChargement(false)
      return
    }
    let annule = false
    setChargement(true)
    chargerShift(agentId, date)
      .then((r) => {
        if (!annule) setResume(r)
      })
      .catch((err) => {
        if (!annule) setErreur(err.message)
      })
      .finally(() => {
        if (!annule) setChargement(false)
      })
    return () => {
      annule = true
    }
  }, [agentId, date, estFutur])

  useEffect(() => {
    onVerrouChange?.(Boolean(resume?.validation))
  }, [resume, onVerrouChange])

  async function agir(action, confirmation) {
    if (!window.confirm(confirmation)) return
    setEnCours(true)
    setErreurAction(null)
    try {
      setResume(await action(resume.planning.id))
    } catch (err) {
      setErreurAction(err.message ?? 'Action impossible.')
    } finally {
      setEnCours(false)
    }
  }

  if (chargement) return <p className="shift-bilan-info">Chargement du bilan…</p>
  if (erreur) return <p className="shift-bilan-erreur">Bilan indisponible : {erreur}</p>
  if (!resume) return null

  const statut = resume.planning.statut
  if (statut !== 'travail' && statut !== 'formation') return null

  return (
    <ShiftBilanContenu
      resume={resume}
      enCours={enCours}
      erreurAction={erreurAction}
      onValider={() =>
        agir(
          validerShift,
          'Valider ce shift ? Le planning de ce jour sera verrouillé : il ne pourra plus être modifié sans dévalidation.'
        )
      }
      onDevalider={() => agir(devaliderShift, 'Dévalider ce shift ? Le jour redeviendra modifiable.')}
    />
  )
}

export function ShiftBilanContenu({ resume, enCours, erreurAction, onValider, onDevalider }) {
  const { totaux, validation } = resume

  if (!resume.termine) {
    return (
      <section className="shift-bilan">
        <p className="shift-bilan-info">
          Le bilan du shift sera disponible à sa fin
          {resume.planning.prevu_fin ? ` (${formatHeure(resume.planning.prevu_fin)})` : ''}.
        </p>
      </section>
    )
  }

  const sansActivite = resume.segments.every((s) => s.statut === 'deconnecte')

  // Les instantanés validés avant la règle du déjeuner n'ont ni déjeuner ni taux d'occupation.
  const regleDejeuner = totaux.dejeuner_secondes !== undefined

  const indicateurs = [
    { label: 'Production', valeur: totaux.prod_secondes },
    { label: 'Pauses', valeur: totaux.pause_secondes },
  ]
  if (regleDejeuner) {
    indicateurs.push({ label: 'Déjeuner', valeur: totaux.dejeuner_secondes })
  }
  if (totaux.taux_occupation != null) {
    indicateurs.push({
      label: "Taux d'occupation",
      valeur: totaux.taux_occupation,
      texte: `${Math.round(totaux.taux_occupation * 100)} %`,
    })
  }
  indicateurs.push(
    { label: 'Dépassement de pause', valeur: totaux.depassement_secondes, alerte: true },
    { label: "Absence sur l'horaire", valeur: totaux.absence_secondes, alerte: true }
  )
  if (totaux.retard_secondes > 0) {
    indicateurs.push({ label: 'Retard', valeur: totaux.retard_secondes, alerte: true })
  }
  if (totaux.depart_anticipe_secondes > 0) {
    indicateurs.push({ label: 'Départ anticipé', valeur: totaux.depart_anticipe_secondes, alerte: true })
  }
  if (totaux.pauses_hors_quota > 0) {
    indicateurs.push({
      label: 'Pauses hors quota',
      valeur: totaux.pauses_hors_quota,
      texte: String(totaux.pauses_hors_quota),
      alerte: true,
    })
  }

  return (
    <section className="shift-bilan">
      <header className="shift-bilan-entete">
        <h3>Bilan du shift</h3>
        <span className={`shift-bilan-statut ${validation ? 'valide' : 'attente'}`}>
          {validation ? 'Validé' : 'En attente de validation'}
        </span>
      </header>

      {sansActivite && (
        <p className="shift-bilan-note">Aucune activité Auréo enregistrée sur cette journée.</p>
      )}

      <ShiftProgressBar resume={resume} />

      <div className="shift-bilan-indicateurs">
        {indicateurs.map((ind) => (
          <div
            key={ind.label}
            className={`shift-bilan-indicateur ${ind.alerte && ind.valeur > 0 ? 'alerte' : ''}`}
          >
            <span>{ind.label}</span>
            <strong>{ind.texte ?? formatDuree(ind.valeur)}</strong>
          </div>
        ))}
      </div>

      {totaux.arrivee && (
        <p className="shift-bilan-presence">
          Première activité {formatHeure(totaux.arrivee)} · Dernière activité {formatHeure(totaux.depart)}
        </p>
      )}

      {regleDejeuner && (
        <p className="shift-bilan-note">
          Temps de travail attendu : {formatDuree(totaux.travail_attendu_secondes)}. Le déjeuner n'est compté ni
          comme temps de travail, ni dans le taux d'occupation.
        </p>
      )}

      {resume.pauses_reelles.length > 0 && (
        <ul className="shift-bilan-pauses">
          {resume.pauses_reelles.map((p, i) => (
            <li key={i}>
              <span className="shift-bilan-pause-nom">{p.nom}</span>
              <span className="shift-bilan-pause-horaire">
                {formatHeure(p.debut)} – {formatHeure(p.fin)}
              </span>
              <span className="shift-bilan-pause-duree">
                {formatDuree(p.secondes)}
                {p.duree_max_secondes ? ` / ${formatDuree(p.duree_max_secondes)} max` : ''}
              </span>
              <span className="shift-bilan-pause-tags">
                {p.depassement_secondes > 0 && (
                  <em className="alerte">+{formatDuree(p.depassement_secondes)}</em>
                )}
                {p.hors_quota && <em className="alerte">Hors quota</em>}
                {p.ouverte && <em>Non clôturée</em>}
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer className="shift-bilan-pied">
        <p>
          {validation
            ? `Validé par ${validation.valide_par_nom ?? 'un responsable'} le ${formatJourHeure(validation.valide_le)}.`
            : resume.peut_valider
              ? 'Vérifiez le déroulé avant de valider : le jour sera ensuite verrouillé.'
              : "Ce shift n'a pas encore été validé."}
        </p>
        {resume.peut_valider && (
          <button className="shift-bilan-valider" onClick={onValider} disabled={enCours}>
            {enCours ? 'Validation…' : 'Valider le shift'}
          </button>
        )}
        {resume.peut_devalider && (
          <button className="shift-bilan-devalider" onClick={onDevalider} disabled={enCours}>
            {enCours ? 'Dévalidation…' : 'Dévalider'}
          </button>
        )}
      </footer>

      {erreurAction && <p className="shift-bilan-erreur">{erreurAction}</p>}
    </section>
  )
}
