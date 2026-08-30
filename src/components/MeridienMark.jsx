// Cadran + ligne méridienne : reprend l'esprit "solaire" tracé à la main
// d'Auréo, mais avec un motif propre à Méridien (le pivot midi du planning).
export default function MeridienMark({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="34" stroke="#F2C230" strokeWidth="3" />
      <line x1="50" y1="8" x2="50" y2="22" stroke="#F2C230" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="78" x2="50" y2="92" stroke="#F2C230" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="16" x2="50" y2="50" stroke="#F2C230" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2="72" y2="62" stroke="#F2C230" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3.5" fill="#F2C230" />
    </svg>
  )
}
