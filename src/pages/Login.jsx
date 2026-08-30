import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import MeridienMark from '../components/MeridienMark'
import './Login.css'

export default function Login({ onConnecte }) {
  const [login, setLogin] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur(null)

    if (!login.trim() || !motDePasse) {
      setErreur('Identifiant et mot de passe requis.')
      return
    }

    setEnCours(true)
    try {
      // 1) On résout l'identifiant (même login que sur Auréo, ex. s.alex)
      //    vers l'email lié au compte Supabase existant.
      const { data: email, error: erreurResolution } = await supabase.rpc(
        'resoudre_email_par_login',
        { p_login: login.trim() }
      )

      if (erreurResolution || !email) {
        setErreur('Identifiant ou mot de passe incorrect.')
        setEnCours(false)
        return
      }

      // 2) Connexion Supabase Auth classique avec l'email résolu
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      })

      if (error) {
        setErreur('Identifiant ou mot de passe incorrect.')
        setEnCours(false)
        return
      }

      onConnecte?.(data.session)
    } catch (err) {
      setErreur("Une erreur est survenue. Réessayez dans un instant.")
      setEnCours(false)
    }
  }

  return (
    <div className="login-screen">
      <div>
        <div className="login-header">
          <MeridienMark />
          <span className="org">XPERIENCE GLOBAL SERVICES</span>
          <h1>MÉRIDIEN</h1>
          <p>Planning des agents — connexion à votre espace</p>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login">Identifiant</label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="ex. s.alex"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          {erreur && <p className="login-error">{erreur}</p>}

          <button className="login-submit" type="submit" disabled={enCours}>
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="login-footnote">
          Les comptes sont créés par un administrateur. Votre identifiant vous
          est communiqué séparément de votre email.
        </p>
      </div>
    </div>
  )
}
