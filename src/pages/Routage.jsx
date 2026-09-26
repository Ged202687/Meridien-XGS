import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useProfil } from '../lib/useProfil'
import Header from '../components/Header'
import MeridienMark from '../components/MeridienMark'
import AgentSpace from './AgentSpace'
import CoachSpace from './CoachSpace'
import SuperviseurSpace from './SuperviseurSpace'
import SuperAdminSpace from './SuperAdminSpace'

export default function Routage({ session }) {
  const { profil, chargement, erreur } = useProfil(session)

  if (chargement) {
    return (
      <div className="meridien-ecran attente" role="status">
        <MeridienMark size={56} />
        <p>Chargement de votre espace…</p>
      </div>
    )
  }

  if (erreur || !profil) {
    return (
      <EcranMessage>Impossible de charger votre profil. Contactez votre administrateur.</EcranMessage>
    )
  }

  if (!profil.actif) {
    return <EcranMessage>Votre compte est désactivé. Contactez votre administrateur.</EcranMessage>
  }

  return (
    <div className="meridien-app-shell">
      <Header profil={profil} />
      {profil.role === 'agent' && <AgentSpace profil={profil} />}
      {profil.role === 'coach' && <CoachSpace profil={profil} />}
      {profil.role === 'superviseur' && <SuperviseurSpace profil={profil} />}
      {profil.role === 'super_admin' && <SuperAdminSpace profil={profil} />}
    </div>
  )
}

// Ouverture de l'espace impossible : message sur fond bleu nuit, avec la
// deconnexion pour changer de compte.
function EcranMessage({ children }) {
  return (
    <div className="meridien-ecran" role="alert">
      <MeridienMark size={56} />
      <p>{children}</p>
      <button type="button" className="meridien-header-logout" onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </button>
    </div>
  )
}
