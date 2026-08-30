import { useEffect, useState } from 'react'
import { listerAgents, listerEquipes } from '../lib/useAgents'
import { listerPlanningsDuJourPourAgents } from '../lib/useEquipeAgents'
import { ajouterJours, formatDateLongue } from '../lib/dateUtils'
import AgentPlanningTable from './AgentPlanningTable'
import EditPlanningModal from './EditPlanningModal'
import StatsResume from './StatsResume'
import PlanningTabs from './PlanningTabs'
import './GlobalPlanning.css'

export default function GlobalPlanning() {
  const [agents, setAgents] = useState([])
  const [equipes, setEquipes] = useState([])
  const [plannings, setPlannings] = useState({})
  const [date, setDate] = useState(new Date())
  const [filtreEquipe, setFiltreEquipe] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [agentSelectionneId, setAgentSelectionneId] = useState('')
  const [agentDeplie, setAgentDeplie] = useState(null)
  const [edition, setEdition] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    Promise.all([listerAgents(), listerEquipes()])
      .then(([ag, eq]) => {
        setAgents(ag)
        setEquipes(eq)
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false))
  }, [])

  function rechargerPlannings() {
    if (agents.length === 0) return
    listerPlanningsDuJourPourAgents(agents.map((a) => a.id), date).then((data) => {
      const parAgent = {}
      data.forEach((p) => {
        parAgent[p.agent_id] = p
      })
      setPlannings(parAgent)
    })
  }

  useEffect(rechargerPlannings, [agents, date])

  if (chargement) return <p className="global-planning-info">Chargement…</p>
  if (erreur) return <p className="global-planning-erreur">{erreur}</p>

  const agentSelectionne = agents.find((a) => a.id === agentSelectionneId)

  const agentsFiltres = agents.filter((a) => {
    const correspondEquipe = !filtreEquipe || a.equipe?.id === filtreEquipe
    if (!correspondEquipe) return false
    if (!filtreStatut) return true
    const p = plannings[a.id]
    if (filtreStatut === 'travail') return p?.statut === 'travail'
    if (filtreStatut === 'repos') return p && p.statut !== 'travail'
    return true
  })

  return (
    <div>
      <div className="global-planning-selecteur">
        <label>Voir le calendrier d'un agent en particulier</label>
        <select value={agentSelectionneId} onChange={(e) => setAgentSelectionneId(e.target.value)}>
          <option value="">— Vue d'ensemble (tous les agents) —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom_complet}
            </option>
          ))}
        </select>
      </div>

      {agentSelectionne ? (
        <PlanningTabs agentId={agentSelectionne.id} nomAgent={agentSelectionne.nom_complet} />
      ) : (
        <>
          <div className="global-planning-nav">
            <button onClick={() => setDate((d) => ajouterJours(d, -1))}>←</button>
            <span>{formatDateLongue(date)}</span>
            <button onClick={() => setDate(new Date())}>Aujourd'hui</button>
            <button onClick={() => setDate((d) => ajouterJours(d, 1))}>→</button>
          </div>

          <div className="global-planning-filtres">
            <select value={filtreEquipe} onChange={(e) => setFiltreEquipe(e.target.value)}>
              <option value="">Toutes les équipes</option>
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nom}
                </option>
              ))}
            </select>
            <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="travail">Travail</option>
              <option value="repos">Repos</option>
            </select>
          </div>

          <StatsResume agents={agentsFiltres} plannings={plannings} />

          <AgentPlanningTable
            agents={agentsFiltres}
            plannings={plannings}
            date={date}
            agentDeplie={agentDeplie}
            setAgentDeplie={setAgentDeplie}
            colonneEquipe={true}
            editable={true}
            onEdit={(agent, planning) => setEdition({ agent, planning })}
          />

          {edition && (
            <EditPlanningModal
              agent={edition.agent}
              date={date}
              planningActuel={edition.planning}
              onFerme={() => setEdition(null)}
              onEnregistre={() => {
                setEdition(null)
                rechargerPlannings()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
