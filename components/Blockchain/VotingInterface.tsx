"use client"

import type { Proposal, Vote } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Clock, TrendingUp, Users, Shield } from "lucide-react"

interface VotingInterfaceProps {
  proposal: Proposal | null
  onClose: () => void
  onSimulateVote: (proposalId: string, vote: "for" | "against") => void
}

export function VotingInterface({ proposal, onClose, onSimulateVote }: VotingInterfaceProps) {
  if (!proposal) return null

  const votesFor = proposal.votes.filter((v) => v.vote === "for").length
  const votesAgainst = proposal.votes.filter((v) => v.vote === "against").length
  const totalVotes = proposal.votes.length
  const progressPercentage = (totalVotes / proposal.requiredVotes) * 100
  const consensusThreshold = Math.ceil(proposal.requiredVotes * 0.66)
  const isApprovalReached = votesFor >= consensusThreshold

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Proposal Details</h2>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Proposal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  proposal.status === "approved"
                    ? "default"
                    : proposal.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {proposal.status}
              </Badge>
              <div>
                <div className="font-medium">Intersection {proposal.intersectionId}</div>
                <div className="text-sm text-muted-foreground">Proposed by {proposal.proposerId}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Current Timing</span>
                <div className="font-medium">
                  NS: {proposal.currentTiming.ns}s<br />
                  EW: {proposal.currentTiming.ew}s<br />
                  All Red: {proposal.currentTiming.allRed}s
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Proposed Timing</span>
                <div className="font-medium text-blue-600">
                  NS: {proposal.proposedTiming.ns}s<br />
                  EW: {proposal.proposedTiming.ew}s<br />
                  All Red: {proposal.proposedTiming.allRed}s
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium">Expected Improvement</span>
              </div>
              <span className="text-lg font-bold text-green-600">+{proposal.expectedImprovement.toFixed(1)}%</span>
            </div>
          </div>

          <Separator />

          {/* Consensus Progress */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Consensus Progress
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Voting Progress</span>
                <span>
                  {totalVotes}/{proposal.requiredVotes} votes received
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">For</span>
                  </div>
                  <div className="text-2xl font-bold">{votesFor}</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Against</span>
                  </div>
                  <div className="text-2xl font-bold">{votesAgainst}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <div className="text-2xl font-bold">{proposal.requiredVotes - totalVotes}</div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {isApprovalReached ? (
                  <span className="text-green-600 font-medium">
                    ✓ Consensus threshold reached ({consensusThreshold} votes needed)
                  </span>
                ) : (
                  <span>Need {consensusThreshold - votesFor} more "for" votes to reach consensus</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Vote History */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Vote History
            </h3>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {proposal.votes.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">No votes cast yet</div>
              ) : (
                proposal.votes.map((vote, index) => <VoteItem key={index} vote={vote} />)
              )}
            </div>
          </div>

          {/* Simulation Controls */}
          {proposal.status === "voting" && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Simulation Controls</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSimulateVote(proposal.id, "for")}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Simulate Vote For
                  </Button>
                  <Button
                    onClick={() => onSimulateVote(proposal.id, "against")}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <XCircle className="w-4 h-4" />
                    Simulate Vote Against
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function VoteItem({ vote }: { vote: Vote }) {
  return (
    <div className="flex items-center justify-between p-2 border border-border rounded">
      <div className="flex items-center gap-2">
        {vote.vote === "for" ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600" />
        )}
        <span className="text-sm font-medium">{vote.nodeId}</span>
      </div>
      <div className="text-xs text-muted-foreground">{new Date(vote.timestamp).toLocaleTimeString()}</div>
    </div>
  )
}
