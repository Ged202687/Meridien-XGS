import TeamView from '../components/TeamView'

export default function SuperviseurSpace({ profil }) {
  return (
    <div className="meridien-page">
      <h1 className="meridien-page-title">Équipes supervisées</h1>
      <p className="meridien-readonly-banner">
        Les modifications de planning passent par le super admin. Vous validez les shifts de vos
        coachs : dépliez une ligne pour voir le bilan du jour.
      </p>
      <TeamView profil={profil} />
    </div>
  )
}
