import { useEffect, useState } from 'react'
import {
  listerEquipesGerees,
  listerAgentsDesEquipes,
  listerPlanningsDuJourPourAgents,
} from '../lib/useEquipeAgents'
import { ajouterJours, formatDateLongue } from '../lib/dateUtils'
import AgentPlanningTable from './AgentPlanningTable'
import StatsResume from './StatsResume'
import './TeamView.css'

export default function TeamView({ profil }) {
  const [equipes, setEquipes] = useState([])
  const [agents, setAgents] = useState([])
  const [plannings, setPlannings] = useState({})
  const [date, setDate] = useState(new Date())
  const [agentDeplie, setAgentDeplie] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let annule = false
    async function charger() {
      setChargement(true)
      setErreur(null)
      try {
        const eq = await listerEquipesGerees(profil)
        if (annule) return
        setEquipes(eq)

        const ag = await listerAgentsDesEquipes(eq.map((e) => e.id))
        if (annule) return
        setAgents(ag)
      } catch (err) {
        if (!annule) setErreur(err.message)
      } finally {
        if (!annule) setChargement(false)
      }
    }
    charger()
    return () => {
      annule = true
    }
  }, [profil])

  useEffect(() => {
    if (agents.length === 0) return
    let annule = false
    listerPlanningsDuJourPourAgents(agents.map((a) => a.id), date).then((data) => {
      if (annule) return
      const parAgent = {}
      data.forEach((p) => {
        parAgent[p.agent_id] = p
      })
      setPlannings(parAgent)
    })
    return () => {
      annule = true
    }
  }, [agents, date])

  if (chargement) return <p className="team-view-info">Chargement…</p>
  if (erreur) return <p className="team-view-erreur">{erreur}</p>

  if (equipes.length === 0) {
    return <p className="team-view-info">Aucune équipe rattachée pour le moment.</p>
  }

  return (
    <div>
      <div className="team-view-nav">
        <button onClick={() => setDate((d) => ajouterJours(d, -1))}>←</button>
        <span>{formatDateLongue(date)}</span>
        <button onClick={() => setDate(new Date())}>Aujourd'hui</button>
        <button onClick={() => setDate((d) => ajouterJours(d, 1))}>→</button>
      </div>

      <p className="team-view-equipes">
        Équipe{equipes.length > 1 ? 's' : ''} : {equipes.map((e) => e.nom).join(', ')}
      </p>

      <StatsResume agents={agents} plannings={plannings} />

      <AgentPlanningTable
        agents={agents}
        plannings={plannings}
        date={date}
        agentDeplie={agentDeplie}
        setAgentDeplie={setAgentDeplie}
        colonneEquipe={false}
      />
    </div>
  )
}
