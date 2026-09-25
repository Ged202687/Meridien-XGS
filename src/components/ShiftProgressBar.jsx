import { LIBELLE_PAUSE } from '../lib/dateUtils'
import { formatDuree, formatHeure } from '../lib/shiftFormat'
import './ShiftProgressBar.css'

const LIBELLE_SEGMENT = {
  en_prod: 'Production',
  en_pause: 'Pause',
  deconnecte: 'Déconnecté',
}

const HEURE = 3600 * 1000

function instant(iso) {
  return iso ? new Date(iso).getTime() : null
}

export default function ShiftProgressBar({ resume }) {
  const prevuDebut = instant(resume.planning.prevu_debut)
  const prevuFin = instant(resume.planning.prevu_fin)
  const actifs = resume.segments.filter((s) => s.statut !== 'deconnecte')

  const bornes = [
    prevuDebut,
    prevuFin,
    ...actifs.flatMap((s) => [instant(s.debut), instant(s.fin)]),
  ].filter((t) => t !== null)
  if (bornes.length === 0) return null

  // Abidjan est à UTC+0 toute l'année : arrondir à l'heure UTC donne l'heure pleine locale.
  const debut = Math.floor(Math.min(...bornes) / HEURE) * HEURE
  const fin = Math.max(Math.ceil(Math.max(...bornes) / HEURE) * HEURE, debut + HEURE)
  const duree = fin - debut

  const pct = (t) => ((Math.min(Math.max(t, debut), fin) - debut) / duree) * 100
  const bloc = (d, f) => ({ left: `${pct(d)}%`, width: `${pct(f) - pct(d)}%` })

  const pas = duree > 12 * HEURE ? 2 * HEURE : HEURE
  const graduations = []
  for (let t = debut; t <= fin; t += pas) graduations.push(t)

  const dejeuners = resume.pauses_reelles.filter((p) => p.compte_presence === false)

  const depassements = resume.pauses_reelles
    .filter((p) => p.depassement_secondes > 0)
    .map((p) => ({ pause: p, debut: instant(p.debut) + p.duree_max_secondes * 1000, fin: instant(p.fin) }))

  return (
    <div className="shift-bar">
      <div className="shift-bar-ligne">
        <span className="shift-bar-etiquette">Réel</span>
        <div
          className="shift-bar-piste"
          role="img"
          aria-label={`Déroulé réel du shift, de ${formatHeure(debut)} à ${formatHeure(fin)}`}
        >
          {resume.segments.map((s, i) => {
            const d = instant(s.debut)
            const f = instant(s.fin)
            if (f <= debut || d >= fin) return null
            return (
              <div
                key={i}
                className={`shift-bar-segment ${s.statut}`}
                style={bloc(d, f)}
                title={`${LIBELLE_SEGMENT[s.statut] ?? s.statut} · ${formatHeure(d)} → ${formatHeure(f)} (${formatDuree((f - d) / 1000)})`}
              />
            )
          })}
          {dejeuners.map((p, i) => (
            <div
              key={`dejeuner-${i}`}
              className="shift-bar-segment dejeuner"
              style={bloc(instant(p.debut), instant(p.fin))}
              title={`${p.nom} · ${formatHeure(p.debut)} → ${formatHeure(p.fin)} (${formatDuree(p.secondes)}) · non travaillé`}
            />
          ))}
          {depassements.map((x, i) => (
            <div
              key={`depassement-${i}`}
              className="shift-bar-segment depassement"
              style={bloc(x.debut, x.fin)}
              title={`Dépassement · ${x.pause.nom} · ${formatDuree(x.pause.depassement_secondes)} au-delà de ${formatDuree(x.pause.duree_max_secondes)}`}
            />
          ))}
        </div>
      </div>

      <div className="shift-bar-ligne">
        <span className="shift-bar-etiquette">Prévu</span>
        <div className="shift-bar-piste prevu">
          {prevuDebut !== null && prevuFin !== null && (
            <div
              className="shift-bar-segment horaire"
              style={bloc(prevuDebut, prevuFin)}
              title={`Horaire prévu · ${formatHeure(prevuDebut)} → ${formatHeure(prevuFin)}`}
            />
          )}
          {resume.pauses_prevues.map((p, i) => (
            <div
              key={i}
              className={`shift-bar-segment pause-prevue ${p.type === 'dejeuner' ? 'dejeuner' : ''}`}
              style={bloc(instant(p.debut), instant(p.fin))}
              title={`${LIBELLE_PAUSE[p.type] ?? 'Pause'} prévue · ${formatHeure(p.debut)} → ${formatHeure(p.fin)}`}
            />
          ))}
        </div>
      </div>

      <div className="shift-bar-ligne">
        <span />
        <div className="shift-bar-axe">
          {graduations.map((t, i) => (
            <span
              key={t}
              style={{ left: `${pct(t)}%` }}
              className={[
                'shift-bar-graduation',
                i === 0 && 'premiere',
                i === graduations.length - 1 && 'derniere',
                i % 2 === 1 && 'secondaire',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {formatHeure(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="shift-bar-legende">
        <span><i className="shift-bar-pastille en_prod" />Production</span>
        <span><i className="shift-bar-pastille en_pause" />Pause</span>
        <span><i className="shift-bar-pastille dejeuner" />Déjeuner (non travaillé)</span>
        <span><i className="shift-bar-pastille deconnecte" />Déconnecté</span>
        <span><i className="shift-bar-pastille depassement" />Dépassement de pause</span>
        <span><i className="shift-bar-pastille pause-prevue" />Pause prévue</span>
      </div>
    </div>
  )
}
