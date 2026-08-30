import TeamView from '../components/TeamView'

export default function SuperviseurSpace({ profil }) {
  return (
    <div className="meridien-page">
      <h1 className="meridien-page-title">Équipes supervisées</h1>
      <p className="meridien-readonly-banner">
        Accès en lecture seule — les modifications de planning passent par le super admin.
      </p>
      <TeamView profil={profil} />
    </div>
  )
}
