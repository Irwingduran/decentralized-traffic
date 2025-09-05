"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Users, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import {
  CONSENSUS_THRESHOLD,
  MIN_NEIGHBORING_VOTES,
  MIN_CONFIDENCE_THRESHOLD,
  MIN_IMPROVEMENT_THRESHOLD,
} from "@/lib/constants"

interface ConsensusRulesProps {
  networkStats: {
    totalNodes: number
    activeNodes: number
    averageUptime: number
    consensusRate: number
  }
}

export function ConsensusRules({ networkStats }: ConsensusRulesProps) {
  return (
    <div className="space-y-6">
      {/* Network Health */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Network Health
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active Nodes</span>
              <span className="font-medium">
                {networkStats.activeNodes}/{networkStats.totalNodes}
              </span>
            </div>
            <Progress value={(networkStats.activeNodes / networkStats.totalNodes) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Network Uptime</span>
              <span className="font-medium">{networkStats.averageUptime.toFixed(1)}%</span>
            </div>
            <Progress value={networkStats.averageUptime} className="h-2" />
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consensus Success Rate</span>
            <Badge variant={networkStats.consensusRate > 80 ? "default" : "secondary"}>
              {networkStats.consensusRate.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </Card>

      {/* Consensus Parameters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Consensus Parameters
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm">Approval Threshold</div>
              <div className="text-xs text-muted-foreground">Minimum percentage of votes required for approval</div>
            </div>
            <Badge variant="outline">{(CONSENSUS_THRESHOLD * 100).toFixed(0)}%</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm">Minimum Votes</div>
              <div className="text-xs text-muted-foreground">Minimum number of neighboring nodes that must vote</div>
            </div>
            <Badge variant="outline">{MIN_NEIGHBORING_VOTES}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm">AI Confidence Threshold</div>
              <div className="text-xs text-muted-foreground">Minimum AI confidence required to submit proposal</div>
            </div>
            <Badge variant="outline">{(MIN_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm">Improvement Threshold</div>
              <div className="text-xs text-muted-foreground">Minimum expected improvement to justify change</div>
            </div>
            <Badge variant="outline">{MIN_IMPROVEMENT_THRESHOLD}%</Badge>
          </div>
        </div>
      </Card>

      {/* Security Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Security Features
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-sm text-blue-900 dark:text-blue-100">Byzantine Fault Tolerance</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                System remains secure with up to 33% malicious nodes
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Clock className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-sm text-green-900 dark:text-green-100">Proposal Timeout</div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Proposals automatically expire after 5 minutes without consensus
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <div className="font-medium text-sm text-purple-900 dark:text-purple-100">Performance Validation</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                All changes are validated against actual traffic performance
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
