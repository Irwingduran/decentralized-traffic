"use client"

import type { Proposal } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, TrendingUp } from "lucide-react"

interface ConsensusProgressProps {
  proposals: Map<string, Proposal>
}

export function ConsensusProgress({ proposals }: ConsensusProgressProps) {
  const activeProposals = Array.from(proposals.values()).filter((p) => p.status === "voting" || p.status === "pending")

  const recentProposals = Array.from(proposals.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Active Proposals */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Active Consensus ({activeProposals.length})
        </h3>

        {activeProposals.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No active proposals</div>
        ) : (
          <div className="space-y-3">
            {activeProposals.map((proposal) => (
              <div key={proposal.id} className="border border-border p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Node {proposal.intersectionId}</div>
                  <Badge variant="secondary">{proposal.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Consensus Progress</span>
                    <span>
                      {proposal.votes.length}/{proposal.requiredVotes}
                    </span>
                  </div>
                  <Progress value={(proposal.votes.length / proposal.requiredVotes) * 100} className="h-1" />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />+{proposal.expectedImprovement.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round((Date.now() - proposal.timestamp) / 1000)}s ago
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h3>

        <div className="space-y-2">
          {recentProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    proposal.status === "approved"
                      ? "default"
                      : proposal.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {proposal.status}
                </Badge>
                <span>Node {proposal.intersectionId}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round((Date.now() - proposal.timestamp) / 60000)}m ago
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
