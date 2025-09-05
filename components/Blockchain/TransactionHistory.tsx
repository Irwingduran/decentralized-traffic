"use client"

import type { Proposal } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, ExternalLink, Download } from "lucide-react"

interface TransactionHistoryProps {
  proposals: Map<string, Proposal>
}

export function TransactionHistory({ proposals }: TransactionHistoryProps) {
  const completedProposals = Array.from(proposals.values())
    .filter((p) => p.status === "approved" || p.status === "rejected")
    .sort((a, b) => b.timestamp - a.timestamp)

  const approvedProposals = completedProposals.filter((p) => p.status === "approved")
  const rejectedProposals = completedProposals.filter((p) => p.status === "rejected")

  const exportHistory = () => {
    const data = completedProposals.map((p) => ({
      id: p.id,
      intersection: p.intersectionId,
      proposer: p.proposerId,
      status: p.status,
      expectedImprovement: p.expectedImprovement,
      votesFor: p.votes.filter((v) => v.vote === "for").length,
      votesAgainst: p.votes.filter((v) => v.vote === "against").length,
      timestamp: new Date(p.timestamp).toISOString(),
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "traffic-consensus-history.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          Transaction History
        </h2>
        <Button onClick={exportHistory} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Export History
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">{completedProposals.length}</div>
          <div className="text-sm text-muted-foreground">Total Proposals</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{approvedProposals.length}</div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </div>
        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{rejectedProposals.length}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <h3 className="font-medium">Recent Transactions</h3>

        {completedProposals.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No completed transactions yet</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {completedProposals.map((proposal) => (
              <TransactionItem key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function TransactionItem({ proposal }: { proposal: Proposal }) {
  const votesFor = proposal.votes.filter((v) => v.vote === "for").length
  const votesAgainst = proposal.votes.filter((v) => v.vote === "against").length

  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <Badge variant={proposal.status === "approved" ? "default" : "destructive"}>{proposal.status}</Badge>
        <div>
          <div className="font-medium text-sm">Intersection {proposal.intersectionId}</div>
          <div className="text-xs text-muted-foreground">
            {proposal.status === "approved" ? "Timing updated" : "Change rejected"} • Votes: {votesFor} for,{" "}
            {votesAgainst} against
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {proposal.status === "approved" && (
          <span className="text-xs text-green-600 font-medium">+{proposal.expectedImprovement.toFixed(1)}%</span>
        )}
        <div className="text-xs text-muted-foreground">{new Date(proposal.timestamp).toLocaleDateString()}</div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
