import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useProfil } from '../lib/useProfil'
import Header from '../components/Header'
import AgentSpace from './AgentSpace'
import CoachSpace from './CoachSpace'
import SuperviseurSpace from './SuperviseurSpace'
import SuperAdminSpace from './SuperAdminSpace'

export default function Routage({ session }) {
  const { profil, chargement, erreur } = useProfil(session)

  if (chargement) {
    return <div className="meridien-page">Chargement de votre espace…</div>
  }

  if (erreur || !profil) {
    return (
      <div className="meridien-page">
        Impossible de charger votre profil. Contactez votre administrateur.
      </div>
    )
  }

  if (!profil.actif) {
    return (
      <div className="meridien-page">
        Votre compte est désactivé. Contactez votre administrateur.
      </div>
    )
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
