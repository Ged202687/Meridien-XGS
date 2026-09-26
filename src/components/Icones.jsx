// Petites icones au trait (style lucide), dessinees ici pour ne pas ajouter
// de dependance. Elles prennent la couleur du texte (currentColor).
function Icone({ taille = 16, children }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconeCloche = (p) => (
  <Icone {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icone>
)
export const IconeSortie = (p) => (
  <Icone {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icone>
)
export const IconePrecedent = (p) => (
  <Icone {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icone>
)
export const IconeSuivant = (p) => (
  <Icone {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icone>
)
