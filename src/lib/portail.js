// Méridien ouvert depuis le portail XGS (portail/meridien/) plutot qu'a sa
// propre adresse.
//
// Le portail et les outils sont alors a la meme adresse : la session Supabase,
// gardee sous sa cle standard, est partagee. La connexion et la deconnexion
// se font sur le portail, qui renvoie ensuite vers Méridien.
export const SOUS_PORTAIL =
  typeof window !== 'undefined' && /^\/meridien(\/|$)/.test(window.location.pathname)

// Page de connexion du portail, avec retour ici une fois connecte.
export function allerAuPortail() {
  window.location.replace(`/?retour=${encodeURIComponent(window.location.pathname)}`)
}
