// Les horodatages du bilan sont des instants absolus : on les affiche à l'heure
// d'Abidjan quel que soit le fuseau du poste, comme le fait la base.
const FUSEAU = 'Africa/Abidjan'

const formatHeureIntl = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSEAU,
})

const formatJourIntl = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: FUSEAU,
})

export function formatHeure(instant) {
  return formatHeureIntl.format(new Date(instant))
}

export function formatJourHeure(instant) {
  const d = new Date(instant)
  return `${formatJourIntl.format(d)} à ${formatHeureIntl.format(d)}`
}

export function formatDuree(secondes) {
  const s = Math.max(0, Math.round(secondes ?? 0))
  if (s === 0) return '0 min'
  if (s < 60) return `${s} s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`
  const reste = s % 60
  return m < 10 && reste > 0 ? `${m} min ${reste} s` : `${m} min`
}
