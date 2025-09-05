"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntersectionCanvas } from "@/components/CityGrid/IntersectionCanvas"
import { MetricsOverlay } from "@/components/CityGrid/MetricsOverlay"
import { NodeGrid } from "@/components/TrafficNodes/NodeGrid"
import { ProposalPanel } from "@/components/TrafficNodes/ProposalPanel"
import { ConsensusProgress } from "@/components/TrafficNodes/ConsensusProgress"
import { ProposalsList } from "@/components/Blockchain/ProposalsList"
import { VotingInterface } from "@/components/Blockchain/VotingInterface"
import { TransactionHistory } from "@/components/Blockchain/TransactionHistory"
import { ConsensusRules } from "@/components/Blockchain/ConsensusRules"
import { PerformanceCharts } from "@/components/Analytics/PerformanceCharts"
import { AIAccuracy } from "@/components/Analytics/AIAccuracy"
import { TrafficHeatmap } from "@/components/Analytics/TrafficHeatmap"
import { EfficiencyTrends } from "@/components/Analytics/EfficiencyTrends"
import { NotificationSystem } from "@/components/UI/NotificationSystem"
import { LiveMetrics } from "@/components/UI/LiveMetrics"
import type { SimulationState, TrafficNode, Proposal, Intersection, Vehicle } from "@/lib/types"
import { generateIntersections, generateTrafficNodes, calculateSystemMetrics } from "@/lib/utils/simulation"
import {
  generateAIRecommendation,
  createProposal,
  simulateNodeVote,
  checkConsensus,
  calculateConsensusMetrics,
} from "@/lib/utils/consensus"
import type { SimulationEvent } from "@/lib/utils/realtime"
import { TRAFFIC_PATTERNS } from "@/lib/constants"
import { Play, Pause, RotateCcw } from "lucide-react"

export default function TrafficManagementDashboard() {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    currentTime: 0,
    intersections: generateIntersections(),
    vehicles: new Map(),
    nodes: generateTrafficNodes(),
    proposals: new Map(),
    metrics: {
      averageWaitTime: 0,
      totalThroughput: 0,
      systemEfficiency: 85,
      activeProposals: 0,
      consensusRate: 0,
    },
    currentPattern: TRAFFIC_PATTERNS[0],
  })

  const [selectedPattern, setSelectedPattern] = useState<string>("normal")
  const [selectedNode, setSelectedNode] = useState<TrafficNode | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [showVotingInterface, setShowVotingInterface] = useState(false)
  const [recentEvents, setRecentEvents] = useState<SimulationEvent[]>([])

  const [analyticsData, setAnalyticsData] = useState<{
    performance: Array<{
      timestamp: number
      efficiency: number
      avgWaitTime: number
      throughput: number
      aiOptimizations: number
    }>
    accuracyHistory: Array<{
      nodeId: string
      timestamp: number
      accuracy: number
      prediction: number
      actual: number
    }>
    patternHistory: Array<{
      pattern: string
      timestamp: number
      efficiency: number
    }>
    efficiencyData: Array<{
      timestamp: number
      efficiency: number
      optimizationsApplied: number
      energySaved: number
      co2Reduced: number
    }>
  }>({
    performance: [],
    accuracyHistory: [],
    patternHistory: [],
    efficiencyData: [],
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationState((prev) => {
        const newState = {
          ...prev,
          metrics: calculateSystemMetrics(prev.intersections, prev.vehicles, prev.proposals),
          currentTime: prev.currentTime + 1,
        }

        if (prev.currentTime % 30 === 0) {
          setAnalyticsData((prevAnalytics) => ({
            ...prevAnalytics,
            performance: [
              ...prevAnalytics.performance.slice(-50),
              {
                timestamp: Date.now(),
                efficiency: newState.metrics.systemEfficiency,
                avgWaitTime: newState.metrics.averageWaitTime,
                throughput: newState.metrics.totalThroughput,
                aiOptimizations: Array.from(newState.proposals.values()).filter((p) => p.status === "approved").length,
              },
            ],
            patternHistory: [
              ...prevAnalytics.patternHistory.slice(-20),
              {
                pattern: newState.currentPattern.id,
                timestamp: Date.now(),
                efficiency: newState.metrics.systemEfficiency,
              },
            ],
            efficiencyData: [
              ...prevAnalytics.efficiencyData.slice(-50),
              {
                timestamp: Date.now(),
                efficiency: newState.metrics.systemEfficiency,
                optimizationsApplied: Math.floor(Math.random() * 3),
                energySaved: Math.random() * 5 + 2,
                co2Reduced: Math.random() * 10 + 5,
              },
            ],
          }))
        }

        if (prev.isRunning && prev.currentTime % 30 === 0) {
          generateAIProposals(newState)
        }

        return newState
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSimulationEvents = (events: SimulationEvent[]) => {
    setRecentEvents((prev) => [...events, ...prev].slice(0, 10))

    events.forEach((event) => {
      if (event.type === "consensus_reached") {
        // Handle consensus reached event
        console.log("Consensus reached for proposal:", event.proposalId)
      }
    })
  }

  const handleStateUpdate = (update: {
    intersections: Map<string, Intersection>
    vehicles: Map<string, Vehicle>
  }) => {
    setSimulationState((prev) => ({
      ...prev,
      intersections: update.intersections,
      vehicles: update.vehicles,
    }))
  }

  const generateAIProposals = (state: SimulationState) => {
    const nodes = Array.from(state.nodes.values()).filter((n) => n.status === "online")

    nodes.forEach((node) => {
      const intersection = state.intersections.get(node.intersectionId)
      if (!intersection || node.currentProposal) return

      const trafficData = {
        avgWait: intersection.averageWait,
        throughput: intersection.throughput,
        queueLengths: [
          intersection.queue.north,
          intersection.queue.south,
          intersection.queue.east,
          intersection.queue.west,
        ],
      }

      const recommendation = generateAIRecommendation(node, intersection, trafficData)
      if (recommendation) {
        const proposal = createProposal(recommendation, node.id, node.neighbors)

        setSimulationState((prev) => {
          const newNodes = new Map(prev.nodes)
          const newProposals = new Map(prev.proposals)

          const updatedNode = { ...node, aiRecommendation: recommendation, currentProposal: proposal }
          newNodes.set(node.id, updatedNode)
          newProposals.set(proposal.id, { ...proposal, status: "voting" as const })

          return {
            ...prev,
            nodes: newNodes,
            proposals: newProposals,
          }
        })

        // Add proposal creation event
        setRecentEvents((prev) => [
          {
            type: "proposal_created",
            proposalId: proposal.id,
            intersectionId: proposal.intersectionId,
            timestamp: Date.now(),
          },
          ...prev,
        ])
      }
    })
  }

  const toggleSimulation = () => {
    setSimulationState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
    }))
  }

  const resetSimulation = () => {
    setSimulationState((prev) => ({
      ...prev,
      isRunning: false,
      currentTime: 0,
      intersections: generateIntersections(),
      vehicles: new Map(),
      proposals: new Map(),
      metrics: {
        averageWaitTime: 0,
        totalThroughput: 0,
        systemEfficiency: 85,
        activeProposals: 0,
        consensusRate: 0,
      },
    }))
    setRecentEvents([])
  }

  const handlePatternChange = (patternId: string) => {
    const pattern = TRAFFIC_PATTERNS.find((p) => p.id === patternId)
    if (pattern) {
      setSelectedPattern(patternId)
      setSimulationState((prev) => ({
        ...prev,
        currentPattern: pattern,
      }))
    }
  }

  const handleNodeClick = (nodeId: string) => {
    const node = simulationState.nodes.get(nodeId)
    if (node) {
      setSelectedNode(node)
    }
  }

  const handleVoteSimulation = (proposalId: string, vote: "for" | "against") => {
    setSimulationState((prev) => {
      const newProposals = new Map(prev.proposals)
      const proposal = newProposals.get(proposalId)

      if (proposal && proposal.status === "voting") {
        const availableNodes = Array.from(prev.nodes.values()).filter(
          (n) => n.status === "online" && !proposal.votes.some((v) => v.nodeId === n.id),
        )

        if (availableNodes.length > 0) {
          const randomNode = availableNodes[Math.floor(Math.random() * availableNodes.length)]
          const simulatedVote = simulateNodeVote(randomNode, proposal, {
            efficiency: prev.metrics.systemEfficiency,
            avgWait: prev.metrics.averageWaitTime,
          })

          proposal.votes.push(simulatedVote)

          const consensusResult = checkConsensus(proposal)
          proposal.status = consensusResult === "pending" ? "voting" : consensusResult

          if (consensusResult !== "pending") {
            setRecentEvents((prevEvents) => [
              {
                type: "consensus_reached",
                proposalId: proposal.id,
                intersectionId: proposal.intersectionId,
                timestamp: Date.now(),
              },
              ...prevEvents,
            ])
          }

          newProposals.set(proposalId, proposal)
        }
      }

      return {
        ...prev,
        proposals: newProposals,
      }
    })
  }

  const handleViewProposal = (proposalId: string) => {
    const proposal = simulationState.proposals.get(proposalId)
    if (proposal) {
      setSelectedProposal(proposal)
      setShowVotingInterface(true)
    }
  }

  const handleCloseVotingInterface = () => {
    setShowVotingInterface(false)
    setSelectedProposal(null)
  }

  const consensusMetrics = calculateConsensusMetrics(simulationState.nodes, simulationState.proposals)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in fade-in-0 duration-500">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground text-balance tracking-tight">
              Decentralized Traffic Management System Esto he modificado
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              AI-powered traffic optimization through blockchain consensus
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={simulationState.isRunning ? "default" : "secondary"}
              className="px-3 py-1 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${simulationState.isRunning ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
              />
              {simulationState.isRunning ? "Running" : "Paused"}
            </Badge>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {Math.floor(simulationState.currentTime / 60)}:
                {(simulationState.currentTime % 60).toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-muted-foreground">Simulation Time</div>
            </div>
          </div>
        </div>

        <Card className="p-6 border-2 hover:border-primary/20 transition-all duration-200 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleSimulation}
                variant={simulationState.isRunning ? "secondary" : "default"}
                className="flex items-center gap-2 px-6 py-2 font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {simulationState.isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Simulation
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Simulation
                  </>
                )}
              </Button>
              <Button
                onClick={resetSimulation}
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 bg-transparent"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-muted-foreground">Traffic Pattern:</label>
              <Select value={selectedPattern} onValueChange={handlePatternChange}>
                <SelectTrigger className="w-52 transition-all duration-200 hover:border-primary/40 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAFFIC_PATTERNS.map((pattern) => (
                    <SelectItem
                      key={pattern.id}
                      value={pattern.id}
                      className="cursor-pointer transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            pattern.id === "normal"
                              ? "bg-green-400"
                              : pattern.id === "rush-hour"
                                ? "bg-orange-400"
                                : pattern.id === "event"
                                  ? "bg-blue-400"
                                  : "bg-red-400"
                          }`}
                        />
                        {pattern.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="grid"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Traffic Grid
            </TabsTrigger>
            <TabsTrigger
              value="nodes"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Node Management
            </TabsTrigger>
            <TabsTrigger
              value="consensus"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Consensus Monitor
            </TabsTrigger>
            <TabsTrigger
              value="blockchain"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Blockchain
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              AI Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card className="p-6 border-2 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">City Traffic Grid (4x4)</h2>
                    <Badge variant="outline" className="text-xs">
                      {Array.from(simulationState.vehicles.values()).length} Active Vehicles
                    </Badge>
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-muted/20">
                    <IntersectionCanvas
                      intersections={simulationState.intersections}
                      vehicles={simulationState.vehicles}
                      isRunning={simulationState.isRunning}
                      trafficPattern={simulationState.currentPattern}
                      onIntersectionClick={(intersectionId) => {
                        console.log("Clicked intersection:", intersectionId)
                      }}
                      onStateUpdate={handleStateUpdate}
                      onEvents={handleSimulationEvents}
                    />
                    <MetricsOverlay metrics={simulationState.metrics} />
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <LiveMetrics metrics={simulationState.metrics} isRunning={simulationState.isRunning} />

                <Card className="p-4 border hover:border-primary/20 transition-all duration-200 hover:shadow-md">
                  <h3 className="font-semibold mb-3 text-foreground">Current Pattern</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          simulationState.currentPattern.id === "normal"
                            ? "bg-green-400"
                            : simulationState.currentPattern.id === "rush-hour"
                              ? "bg-orange-400"
                              : simulationState.currentPattern.id === "event"
                                ? "bg-blue-400"
                                : "bg-red-400"
                        }`}
                      />
                      <div className="font-medium text-sm">{simulationState.currentPattern.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {simulationState.currentPattern.description}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{simulationState.currentPattern.duration} min</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nodes" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NodeGrid nodes={simulationState.nodes} onNodeClick={handleNodeClick} />
              <ProposalPanel selectedNode={selectedNode} onVoteSimulation={handleVoteSimulation} />
            </div>
          </TabsContent>

          <TabsContent value="consensus" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <ConsensusProgress proposals={simulationState.proposals} />
          </TabsContent>

          <TabsContent
            value="blockchain"
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProposalsList proposals={simulationState.proposals} onViewProposal={handleViewProposal} />
              </div>
              <div className="space-y-6">
                <ConsensusRules networkStats={consensusMetrics} />
                <TransactionHistory proposals={simulationState.proposals} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                <TabsTrigger value="performance" className="transition-all duration-200">
                  Performance
                </TabsTrigger>
                <TabsTrigger value="accuracy" className="transition-all duration-200">
                  AI Accuracy
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="transition-all duration-200">
                  Traffic Patterns
                </TabsTrigger>
                <TabsTrigger value="efficiency" className="transition-all duration-200">
                  Efficiency Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="performance">
                <PerformanceCharts data={analyticsData.performance} currentMetrics={simulationState.metrics} />
              </TabsContent>

              <TabsContent value="accuracy">
                <AIAccuracy nodes={simulationState.nodes} accuracyHistory={analyticsData.accuracyHistory} />
              </TabsContent>

              <TabsContent value="heatmap">
                <TrafficHeatmap
                  intersections={simulationState.intersections}
                  currentPattern={simulationState.currentPattern}
                  patternHistory={analyticsData.patternHistory}
                />
              </TabsContent>

              <TabsContent value="efficiency">
                <EfficiencyTrends data={analyticsData.efficiencyData} targetEfficiency={90} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {showVotingInterface && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in-0 duration-200">
            <VotingInterface
              proposal={selectedProposal}
              onClose={handleCloseVotingInterface}
              onSimulateVote={handleVoteSimulation}
            />
          </div>
        )}

        <NotificationSystem events={recentEvents} />
      </div>
    </div>
  )
}
