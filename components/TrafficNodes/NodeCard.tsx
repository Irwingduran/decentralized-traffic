"use client"

import type { TrafficNode } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, CheckCircle, Clock, Vote } from "lucide-react"

interface NodeCardProps {
  node: TrafficNode
  onClick: () => void
}

export function NodeCard({ node, onClick }: NodeCardProps) {
  const getStatusColor = () => {
    switch (node.status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-gray-500"
      case "malicious":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = () => {
    switch (node.status) {
      case "online":
        return <CheckCircle className="w-3 h-3" />
      case "offline":
        return <Clock className="w-3 h-3" />
      case "malicious":
        return <AlertTriangle className="w-3 h-3" />
      default:
        return <Activity className="w-3 h-3" />
    }
  }

  return (
    <Card className="p-3 cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
      <div className="space-y-2">
        {/* Node Header */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">{node.intersectionId}</div>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        </div>

        {/* Status Badge */}
        <Badge variant={node.status === "online" ? "default" : "secondary"} className="text-xs flex items-center gap-1">
          {getStatusIcon()}
          {node.status}
        </Badge>

        {/* AI Recommendation Status */}
        {node.aiRecommendation && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              AI: {node.aiRecommendation.expectedImprovement.toFixed(1)}% improvement
            </div>
          </div>
        )}

        {/* Current Proposal */}
        {node.currentProposal && (
          <div className="text-xs">
            <div className="flex items-center gap-1 text-blue-600">
              <Vote className="w-3 h-3" />
              Proposal: {node.currentProposal.status}
            </div>
            <div className="text-muted-foreground">
              Votes: {node.currentProposal.votes.length}/{node.currentProposal.requiredVotes}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accuracy:</span>
            <span className="font-medium">{(node.performance.accuracy * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{node.performance.uptime.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
