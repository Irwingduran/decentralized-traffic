"use client"

import type { Proposal } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, Users, Eye } from "lucide-react"

interface ProposalsListProps {
  proposals: Map<string, Proposal>
  onViewProposal: (proposalId: string) => void
}

export function ProposalsList({ proposals, onViewProposal }: ProposalsListProps) {
  const proposalArray = Array.from(proposals.values()).sort((a, b) => b.timestamp - a.timestamp)

  const activeProposals = proposalArray.filter((p) => p.status === "voting" || p.status === "pending")
  const completedProposals = proposalArray.filter((p) => p.status === "approved" || p.status === "rejected")

  return (
    <div className="space-y-6">
      {/* Active Proposals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Active Proposals ({activeProposals.length})
        </h3>

        {activeProposals.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No active proposals in the network</div>
        ) : (
          <div className="space-y-4">
            {activeProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} onView={() => onViewProposal(proposal.id)} />
            ))}
          </div>
        )}
      </Card>

      {/* Recent Completed Proposals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity ({completedProposals.length})
        </h3>

        <div className="space-y-3">
          {completedProposals.slice(0, 10).map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => onViewProposal(proposal.id)}
            >
              <div className="flex items-center gap-3">
                <Badge variant={proposal.status === "approved" ? "default" : "destructive"}>{proposal.status}</Badge>
                <div>
                  <div className="font-medium text-sm">Node {proposal.intersectionId}</div>
                  <div className="text-xs text-muted-foreground">
                    Expected: +{proposal.expectedImprovement.toFixed(1)}% improvement
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(proposal.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ProposalCard({ proposal, onView }: { proposal: Proposal; onView: () => void }) {
  const votesFor = proposal.votes.filter((v) => v.vote === "for").length
  const votesAgainst = proposal.votes.filter((v) => v.vote === "against").length
  const totalVotes = proposal.votes.length
  const progressPercentage = (totalVotes / proposal.requiredVotes) * 100
  const consensusThreshold = Math.ceil(proposal.requiredVotes * 0.66)

  return (
    <div className="border border-border p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={proposal.status === "voting" ? "default" : "secondary"}>{proposal.status}</Badge>
          <div>
            <div className="font-medium">Intersection {proposal.intersectionId}</div>
            <div className="text-sm text-muted-foreground">Proposed by {proposal.proposerId}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onView} className="flex items-center gap-1 bg-transparent">
          <Eye className="w-3 h-3" />
          View Details
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Current Timing:</span>
          <div className="font-medium">
            NS: {proposal.currentTiming.ns}s, EW: {proposal.currentTiming.ew}s
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Proposed Timing:</span>
          <div className="font-medium text-blue-600">
            NS: {proposal.proposedTiming.ns}s, EW: {proposal.proposedTiming.ew}s
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">+{proposal.expectedImprovement.toFixed(1)}%</span>
        </div>
        <div className="text-sm text-muted-foreground">Confidence: {(proposal.confidence * 100).toFixed(0)}%</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Consensus Progress</span>
          <span>
            {totalVotes}/{proposal.requiredVotes} votes
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            For: {votesFor} | Against: {votesAgainst}
          </span>
          <span>Need {consensusThreshold} for approval</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Submitted {Math.round((Date.now() - proposal.timestamp) / 60000)} minutes ago
      </div>
    </div>
  )
}
