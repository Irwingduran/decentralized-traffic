import type { TrafficNode, Proposal, Vote, Intersection, TimingRecommendation } from "../types"
import { generateId } from "./simulation"
import { CONSENSUS_THRESHOLD, MIN_NEIGHBORING_VOTES, MIN_IMPROVEMENT_THRESHOLD } from "../constants"

// Generate AI recommendation for a traffic node
export function generateAIRecommendation(
  node: TrafficNode,
  intersection: Intersection,
  trafficData: { avgWait: number; throughput: number; queueLengths: number[] },
): TimingRecommendation | null {
  // Simple AI logic - analyze current performance and suggest improvements
  const currentTiming = intersection.timing
  const { avgWait, throughput, queueLengths } = trafficData

  // Determine if optimization is needed
  const maxQueue = Math.max(...queueLengths)
  const isBottleneck = avgWait > 45 || maxQueue > 8 || throughput < 20

  if (!isBottleneck) return null

  // Generate timing recommendation based on queue analysis
  const proposedTiming = { ...currentTiming }
  let expectedImprovement = 0
  let reasoning = ""

  // Analyze queue imbalance
  const nsQueues = queueLengths[0] + queueLengths[1] // north + south
  const ewQueues = queueLengths[2] + queueLengths[3] // east + west

  if (nsQueues > ewQueues * 1.5) {
    // North-South has more traffic
    proposedTiming.ns = Math.min(currentTiming.ns + 10, 60)
    proposedTiming.ew = Math.max(currentTiming.ew - 5, 15)
    expectedImprovement = Math.min(((nsQueues - ewQueues) / nsQueues) * 20, 25)
    reasoning = "Increased NS green time due to higher queue lengths in north-south direction"
  } else if (ewQueues > nsQueues * 1.5) {
    // East-West has more traffic
    proposedTiming.ew = Math.min(currentTiming.ew + 10, 60)
    proposedTiming.ns = Math.max(currentTiming.ns - 5, 15)
    expectedImprovement = Math.min(((ewQueues - nsQueues) / ewQueues) * 20, 25)
    reasoning = "Increased EW green time due to higher queue lengths in east-west direction"
  } else if (avgWait > 50) {
    // General optimization for high wait times
    const totalCycle = currentTiming.ns + currentTiming.ew + currentTiming.allRed
    if (totalCycle > 90) {
      // Reduce cycle time
      proposedTiming.ns = Math.max(currentTiming.ns - 5, 20)
      proposedTiming.ew = Math.max(currentTiming.ew - 5, 20)
      expectedImprovement = Math.min(((avgWait - 30) / avgWait) * 15, 20)
      reasoning = "Reduced cycle time to decrease overall wait times"
    }
  }

  // Only return recommendation if improvement is significant
  if (expectedImprovement < MIN_IMPROVEMENT_THRESHOLD) return null

  const confidence = Math.min(0.7 + expectedImprovement / 100, 0.95)

  return {
    intersectionId: intersection.id,
    currentTiming,
    proposedTiming,
    expectedImprovement,
    confidence,
    reasoning,
  }
}

// Create a new proposal from AI recommendation
export function createProposal(
  recommendation: TimingRecommendation,
  proposerId: string,
  neighboringNodes: string[],
): Proposal {
  return {
    id: generateId("proposal"),
    proposerId,
    intersectionId: recommendation.intersectionId,
    currentTiming: recommendation.currentTiming,
    proposedTiming: recommendation.proposedTiming,
    expectedImprovement: recommendation.expectedImprovement,
    confidence: recommendation.confidence,
    votes: [],
    status: "pending",
    timestamp: Date.now(),
    requiredVotes: Math.max(MIN_NEIGHBORING_VOTES, Math.ceil(neighboringNodes.length * 0.8)),
  }
}

// Simulate AI voting decision
export function simulateNodeVote(
  votingNode: TrafficNode,
  proposal: Proposal,
  networkPerformance: { efficiency: number; avgWait: number },
): Vote {
  // Factors that influence voting decision
  const nodeReliability = votingNode.performance.accuracy
  const proposalConfidence = proposal.confidence
  const expectedImprovement = proposal.expectedImprovement
  const currentEfficiency = networkPerformance.efficiency

  // Calculate vote probability based on multiple factors
  let voteForProbability = 0.5

  // Higher confidence proposals are more likely to be approved
  voteForProbability += (proposalConfidence - 0.5) * 0.4

  // Higher expected improvement increases approval likelihood
  voteForProbability += (expectedImprovement / 100) * 0.3

  // Reliable nodes are more conservative
  if (nodeReliability > 0.9) {
    voteForProbability -= 0.1
  }

  // If system is already performing well, be more conservative
  if (currentEfficiency > 90) {
    voteForProbability -= 0.2
  }

  // Add some randomness to simulate real-world variability
  voteForProbability += (Math.random() - 0.5) * 0.2

  const voteFor = voteForProbability > 0.5

  return {
    nodeId: votingNode.id,
    vote: voteFor ? "for" : "against",
    reason: voteFor
      ? `Supports optimization with ${expectedImprovement.toFixed(1)}% expected improvement`
      : `Concerns about ${expectedImprovement < 10 ? "low improvement potential" : "system stability"}`,
    timestamp: Date.now(),
  }
}

// Check if proposal has reached consensus
export function checkConsensus(proposal: Proposal): "approved" | "rejected" | "pending" {
  if (proposal.votes.length < proposal.requiredVotes) {
    return "pending"
  }

  const votesFor = proposal.votes.filter((v) => v.vote === "for").length
  const threshold = Math.ceil(proposal.requiredVotes * CONSENSUS_THRESHOLD)

  return votesFor >= threshold ? "approved" : "rejected"
}

// Apply approved proposal to intersection
export function applyProposal(proposal: Proposal, intersection: Intersection): Intersection {
  if (proposal.status !== "approved") return intersection

  return {
    ...intersection,
    timing: proposal.proposedTiming,
    lastChange: Date.now(),
  }
}

// Calculate network consensus health metrics
export function calculateConsensusMetrics(
  nodes: Map<string, TrafficNode>,
  proposals: Map<string, Proposal>,
): {
  totalNodes: number
  activeNodes: number
  averageUptime: number
  consensusRate: number
} {
  const nodeArray = Array.from(nodes.values())
  const proposalArray = Array.from(proposals.values())

  const totalNodes = nodeArray.length
  const activeNodes = nodeArray.filter((n) => n.status === "online").length
  const averageUptime = nodeArray.reduce((sum, n) => sum + n.performance.uptime, 0) / totalNodes

  const completedProposals = proposalArray.filter((p) => p.status === "approved" || p.status === "rejected")
  const approvedProposals = proposalArray.filter((p) => p.status === "approved")
  const consensusRate = completedProposals.length > 0 ? (approvedProposals.length / completedProposals.length) * 100 : 0

  return {
    totalNodes,
    activeNodes,
    averageUptime,
    consensusRate,
  }
}
