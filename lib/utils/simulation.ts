import type { Intersection, Vehicle, TrafficNode, Proposal, SystemMetrics, Direction } from "../types"
import { GRID_SIZE, DEFAULT_TIMING, INTERSECTION_SPACING } from "../constants"

// Generate initial intersection grid
export function generateIntersections(): Map<string, Intersection> {
  const intersections = new Map<string, Intersection>()

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const id = `${row}-${col}`
      const intersection: Intersection = {
        id,
        x: col * INTERSECTION_SPACING + 50,
        y: row * INTERSECTION_SPACING + 50,
        lightState: "ns_green",
        timing: { ...DEFAULT_TIMING },
        queue: { north: 0, south: 0, east: 0, west: 0 },
        throughput: 0,
        averageWait: 0,
        lastChange: Date.now(),
      }
      intersections.set(id, intersection)
    }
  }

  return intersections
}

// Generate traffic nodes for each intersection
export function generateTrafficNodes(): Map<string, TrafficNode> {
  const nodes = new Map<string, TrafficNode>()

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const intersectionId = `${row}-${col}`
      const nodeId = `node-${intersectionId}`

      // Calculate neighboring nodes
      const neighbors: string[] = []
      if (row > 0) neighbors.push(`node-${row - 1}-${col}`)
      if (row < GRID_SIZE - 1) neighbors.push(`node-${row + 1}-${col}`)
      if (col > 0) neighbors.push(`node-${row}-${col - 1}`)
      if (col < GRID_SIZE - 1) neighbors.push(`node-${row}-${col + 1}`)

      const node: TrafficNode = {
        id: nodeId,
        intersectionId,
        status: "online",
        aiRecommendation: null,
        currentProposal: null,
        votingHistory: [],
        performance: {
          accuracy: 0.85,
          proposalsSubmitted: 0,
          proposalsApproved: 0,
          averageImprovement: 0,
          uptime: 100,
        },
        neighbors,
      }

      nodes.set(nodeId, node)
    }
  }

  return nodes
}

// Calculate system-wide metrics
export function calculateSystemMetrics(
  intersections: Map<string, Intersection>,
  vehicles: Map<string, Vehicle>,
  proposals: Map<string, Proposal>,
): SystemMetrics {
  const intersectionArray = Array.from(intersections.values())
  const vehicleArray = Array.from(vehicles.values())
  const proposalArray = Array.from(proposals.values())

  const averageWaitTime = intersectionArray.reduce((sum, i) => sum + i.averageWait, 0) / intersectionArray.length
  const totalThroughput = intersectionArray.reduce((sum, i) => sum + i.throughput, 0)

  // Calculate efficiency based on throughput vs wait time
  const systemEfficiency = Math.max(0, Math.min(100, (totalThroughput / Math.max(1, averageWaitTime)) * 10))

  const activeProposals = proposalArray.filter((p) => p.status === "voting" || p.status === "pending").length

  const completedProposals = proposalArray.filter((p) => p.status === "approved" || p.status === "rejected")
  const approvedProposals = proposalArray.filter((p) => p.status === "approved")
  const consensusRate = completedProposals.length > 0 ? (approvedProposals.length / completedProposals.length) * 100 : 0

  return {
    averageWaitTime,
    totalThroughput,
    systemEfficiency,
    activeProposals,
    consensusRate,
  }
}

// Generate unique IDs
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Calculate distance between two points
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// Get opposite direction
export function getOppositeDirection(direction: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
  }
  return opposites[direction]
}
