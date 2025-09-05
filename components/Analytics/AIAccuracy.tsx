"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import type { TrafficNode } from "@/lib/types"
import { Brain, Target, TrendingUp, Award } from "lucide-react"

interface AIAccuracyProps {
  nodes: Map<string, TrafficNode>
  accuracyHistory: Array<{
    nodeId: string
    timestamp: number
    accuracy: number
    prediction: number
    actual: number
  }>
}

export function AIAccuracy({ nodes, accuracyHistory }: AIAccuracyProps) {
  const nodeArray = Array.from(nodes.values())

  // Calculate overall AI performance metrics
  const overallAccuracy = nodeArray.reduce((sum, node) => sum + node.performance.accuracy, 0) / nodeArray.length
  const totalProposals = nodeArray.reduce((sum, node) => sum + node.performance.proposalsSubmitted, 0)
  const totalApproved = nodeArray.reduce((sum, node) => sum + node.performance.proposalsApproved, 0)
  const approvalRate = totalProposals > 0 ? (totalApproved / totalProposals) * 100 : 0

  // Prepare data for charts
  const accuracyData = nodeArray.map((node) => ({
    name: node.intersectionId,
    accuracy: node.performance.accuracy * 100,
    proposals: node.performance.proposalsSubmitted,
    approved: node.performance.proposalsApproved,
    fill: getAccuracyColor(node.performance.accuracy),
  }))

  const performanceDistribution = [
    { name: "Excellent (>90%)", value: nodeArray.filter((n) => n.performance.accuracy > 0.9).length, fill: "#10b981" },
    {
      name: "Good (80-90%)",
      value: nodeArray.filter((n) => n.performance.accuracy >= 0.8 && n.performance.accuracy <= 0.9).length,
      fill: "#3b82f6",
    },
    {
      name: "Fair (70-80%)",
      value: nodeArray.filter((n) => n.performance.accuracy >= 0.7 && n.performance.accuracy < 0.8).length,
      fill: "#f59e0b",
    },
    { name: "Poor (<70%)", value: nodeArray.filter((n) => n.performance.accuracy < 0.7).length, fill: "#ef4444" },
  ]

  function getAccuracyColor(accuracy: number): string {
    if (accuracy > 0.9) return "#10b981"
    if (accuracy > 0.8) return "#3b82f6"
    if (accuracy > 0.7) return "#f59e0b"
    return "#ef4444"
  }

  const topPerformers = nodeArray.sort((a, b) => b.performance.accuracy - a.performance.accuracy).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* AI Performance Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              <p className="text-2xl font-bold">{(overallAccuracy * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-2xl font-bold">{approvalRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Proposals</p>
              <p className="text-2xl font-bold">{totalProposals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{totalApproved}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Accuracy Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Node Accuracy Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={accuracyData}>
              <RadialBar dataKey="accuracy" cornerRadius={10} fill="#8884d8" />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]} />
            </RadialBarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing AI Nodes</h3>
        <div className="space-y-3">
          {topPerformers.map((node, index) => (
            <div key={node.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                <div>
                  <div className="font-medium">Node {node.intersectionId}</div>
                  <div className="text-sm text-muted-foreground">
                    {node.performance.proposalsSubmitted} proposals • {node.performance.proposalsApproved} approved
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{(node.performance.accuracy * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">accuracy</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Individual Node Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Individual Node Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodeArray.map((node) => (
            <div key={node.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Node {node.intersectionId}</span>
                <Badge
                  variant={node.performance.accuracy > 0.8 ? "default" : "secondary"}
                  style={{ backgroundColor: getAccuracyColor(node.performance.accuracy) }}
                >
                  {(node.performance.accuracy * 100).toFixed(0)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Accuracy</span>
                  <span>{(node.performance.accuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={node.performance.accuracy * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Proposals:</span>
                  <div className="font-medium">{node.performance.proposalsSubmitted}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Approved:</span>
                  <div className="font-medium">{node.performance.proposalsApproved}</div>
                </div>
              </div>

              <div className="text-xs">
                <span className="text-muted-foreground">Avg Improvement:</span>
                <div className="font-medium text-green-600">+{node.performance.averageImprovement.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
