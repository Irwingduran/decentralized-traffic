"use client"

import type { TrafficNode } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react"

interface ProposalPanelProps {
  selectedNode: TrafficNode | null
  onVoteSimulation: (proposalId: string, vote: "for" | "against") => void
}

export function ProposalPanel({ selectedNode, onVoteSimulation }: ProposalPanelProps) {
  if (!selectedNode) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Select a node to view AI recommendations and proposals</div>
      </Card>
    )
  }

  const { aiRecommendation, currentProposal } = selectedNode

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Node {selectedNode.intersectionId} - AI Analysis</h3>

      <div className="space-y-6">
        {/* AI Recommendation */}
        {aiRecommendation && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              AI Recommendation
            </h4>

            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Timing:</span>
                  <div className="font-medium">
                    NS: {aiRecommendation.currentTiming.ns}s, EW: {aiRecommendation.currentTiming.ew}s
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Proposed Timing:</span>
                  <div className="font-medium text-blue-600">
                    NS: {aiRecommendation.proposedTiming.ns}s, EW: {aiRecommendation.proposedTiming.ew}s
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground text-sm">Expected Improvement:</span>
                  <div className="font-semibold text-green-600">
                    +{aiRecommendation.expectedImprovement.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Confidence:</span>
                  <div className="font-semibold">{(aiRecommendation.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>Reasoning:</strong> {aiRecommendation.reasoning}
              </div>
            </div>
          </div>
        )}

        {/* Current Proposal */}
        {currentProposal && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Proposal
            </h4>

            <div className="border border-border p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    currentProposal.status === "approved"
                      ? "default"
                      : currentProposal.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {currentProposal.status}
                </Badge>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(currentProposal.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Voting Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Consensus Progress</span>
                  <span>
                    {currentProposal.votes.length}/{currentProposal.requiredVotes} votes
                  </span>
                </div>
                <Progress
                  value={(currentProposal.votes.length / currentProposal.requiredVotes) * 100}
                  className="h-2"
                />
              </div>

              {/* Vote Breakdown */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Vote Breakdown:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>For: {currentProposal.votes.filter((v) => v.vote === "for").length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Against: {currentProposal.votes.filter((v) => v.vote === "against").length}</span>
                  </div>
                </div>
              </div>

              {/* Simulation Buttons */}
              {currentProposal.status === "voting" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVoteSimulation(currentProposal.id, "for")}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Simulate Vote For
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVoteSimulation(currentProposal.id, "against")}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    Simulate Vote Against
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Node Performance */}
        <div className="space-y-3">
          <h4 className="font-medium">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Proposals Submitted:</span>
              <div className="font-medium">{selectedNode.performance.proposalsSubmitted}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Approval Rate:</span>
              <div className="font-medium">
                {selectedNode.performance.proposalsSubmitted > 0
                  ? (
                      (selectedNode.performance.proposalsApproved / selectedNode.performance.proposalsSubmitted) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Improvement:</span>
              <div className="font-medium text-green-600">
                +{selectedNode.performance.averageImprovement.toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Network Uptime:</span>
              <div className="font-medium">{selectedNode.performance.uptime.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
