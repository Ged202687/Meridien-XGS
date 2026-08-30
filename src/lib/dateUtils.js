// "HH:MM" ou "HH:MM:SS" -> minutes depuis minuit
export function heureVersMinutes(heureStr) {
  if (!heureStr) return null
  const [h, m] = heureStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesVersHeure(min) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

export function formatDateISO(date) {
  return date.toISOString().slice(0, 10)
}

export function ajouterJours(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function lundiDeSemaine(date) {
  const d = new Date(date)
  const jour = d.getDay() // 0 = dimanche ... 6 = samedi
  const decalage = jour === 0 ? -6 : 1 - jour
  d.setDate(d.getDate() + decalage)
  d.setHours(0, 0, 0, 0)
  return d
}

export function ajouterSemaines(date, n) {
  return ajouterJours(date, n * 7)
}

export function formatDateCourte(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function premierJourAffichageMois(date) {
  const premier = new Date(date.getFullYear(), date.getMonth(), 1)
  return lundiDeSemaine(premier)
}

export function dernierJourAffichageMois(date) {
  const dernier = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const d = new Date(dernier)
  const jour = d.getDay()
  const decalage = jour === 0 ? 0 : 7 - jour
  d.setDate(d.getDate() + decalage)
  return d
}

const MOIS_LONG = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function formatMoisAnnee(date) {
  return `${MOIS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

export function ajouterMois(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export function formatDateLongue(date) {
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]}`
}

export const LIBELLE_STATUT = {
  travail: 'Travail',
  repos_fixe: 'Repos (dimanche)',
  repos_rotatif: 'Repos',
  conge: 'Congé',
  absence: 'Absence',
}

export const LIBELLE_PAUSE = {
  pause15_tranche1: 'Pause 15 min',
  pause15_tranche2: 'Pause 15 min',
  dejeuner: 'Déjeuner',
}
