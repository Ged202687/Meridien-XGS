// Cadran + ligne méridienne : reprend l'esprit "solaire" tracé à la main
// d'Auréo, mais avec un motif propre à Méridien (le pivot midi du planning).
// Jaune soleil de la charte XGS.
const SOLEIL = '#FDCF4F'

export default function MeridienMark({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="34" stroke={SOLEIL} strokeWidth="3" />
      <line x1="50" y1="8" x2="50" y2="22" stroke={SOLEIL} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="78" x2="50" y2="92" stroke={SOLEIL} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="16" x2="50" y2="50" stroke={SOLEIL} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2="72" y2="62" stroke={SOLEIL} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3.5" fill={SOLEIL} />
    </svg>
  )
}
