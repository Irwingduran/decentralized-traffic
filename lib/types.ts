// Core data structures for the decentralized traffic management system

export type LightState = "ns_green" | "ew_green" | "all_red"
export type Direction = "north" | "south" | "east" | "west"
export type VehicleType = "car" | "truck" | "bus"
export type NodeStatus = "online" | "offline" | "malicious"
export type ProposalStatus = "pending" | "voting" | "approved" | "rejected" | "executed"
export type VoteType = "for" | "against"

export interface Timing {
  ns: number // North-South green light duration in seconds
  ew: number // East-West green light duration in seconds
  allRed: number // All red safety buffer in seconds
}

export interface QueueLengths {
  north: number
  south: number
  east: number
  west: number
}

export interface Intersection {
  id: string // Format: "row-col" (e.g., "0-0", "1-2")
  x: number // Canvas X coordinate
  y: number // Canvas Y coordinate
  lightState: LightState
  timing: Timing
  queue: QueueLengths
  throughput: number // Vehicles per minute
  averageWait: number // Average wait time in seconds
  lastChange: number // Timestamp of last light change
}

export interface Vehicle {
  id: string
  x: number
  y: number
  direction: Direction
  speed: number // Pixels per frame
  route: string[] // Array of intersection IDs
  waitTime: number // Current wait time in seconds
  type: VehicleType
  targetIntersection: string // Next intersection ID
}

export interface TimingRecommendation {
  intersectionId: string
  currentTiming: Timing
  proposedTiming: Timing
  expectedImprovement: number // Percentage improvement
  confidence: number // AI confidence score (0-1)
  reasoning: string
}

export interface Vote {
  nodeId: string
  vote: VoteType
  reason: string
  timestamp: number
}

export interface Proposal {
  id: string
  proposerId: string
  intersectionId: string
  currentTiming: Timing
  proposedTiming: Timing
  expectedImprovement: number
  confidence: number
  votes: Vote[]
  status: ProposalStatus
  timestamp: number
  requiredVotes: number // Minimum votes needed for consensus
}

export interface NodeMetrics {
  accuracy: number // Historical prediction accuracy
  proposalsSubmitted: number
  proposalsApproved: number
  averageImprovement: number
  uptime: number // Percentage uptime
}

export interface TrafficNode {
  id: string
  intersectionId: string
  status: NodeStatus
  aiRecommendation: TimingRecommendation | null
  currentProposal: Proposal | null
  votingHistory: Vote[]
  performance: NodeMetrics
  neighbors: string[] // IDs of neighboring nodes for consensus
}

export interface SystemMetrics {
  averageWaitTime: number
  totalThroughput: number
  systemEfficiency: number // Overall efficiency score (0-100)
  activeProposals: number
  consensusRate: number // Percentage of proposals reaching consensus
}

export interface TrafficPattern {
  id: string
  name: string
  description: string
  multipliers: {
    north: number
    south: number
    east: number
    west: number
  }
  duration: number // Duration in minutes
}

export interface SimulationState {
  isRunning: boolean
  currentTime: number
  intersections: Map<string, Intersection>
  vehicles: Map<string, Vehicle>
  nodes: Map<string, TrafficNode>
  proposals: Map<string, Proposal>
  metrics: SystemMetrics
  currentPattern: TrafficPattern
}
