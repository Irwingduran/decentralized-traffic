"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react"
import type { SystemMetrics } from "@/lib/types"

interface LiveMetricsProps {
  metrics: SystemMetrics
  isRunning: boolean
}

interface MetricTrend {
  value: number
  change: number
  trend: "up" | "down" | "stable"
}

export function LiveMetrics({ metrics, isRunning }: LiveMetricsProps) {
  const [metricHistory, setMetricHistory] = useState<SystemMetrics[]>([])
  const [trends, setTrends] = useState<{
    efficiency: MetricTrend
    waitTime: MetricTrend
    throughput: MetricTrend
  }>({
    efficiency: { value: 0, change: 0, trend: "stable" },
    waitTime: { value: 0, change: 0, trend: "stable" },
    throughput: { value: 0, change: 0, trend: "stable" },
  })

  useEffect(() => {
    setMetricHistory((prev) => {
      const newHistory = [...prev, metrics].slice(-10) // Keep last 10 readings

      if (newHistory.length >= 2) {
        const current = newHistory[newHistory.length - 1]
        const previous = newHistory[newHistory.length - 2]

        setTrends({
          efficiency: calculateTrend(current.systemEfficiency, previous.systemEfficiency),
          waitTime: calculateTrend(current.averageWaitTime, previous.averageWaitTime, true), // Inverted for wait time
          throughput: calculateTrend(current.totalThroughput, previous.totalThroughput),
        })
      }

      return newHistory
    })
  }, [metrics])

  const calculateTrend = (current: number, previous: number, inverted = false): MetricTrend => {
    const change = current - previous
    const percentChange = previous !== 0 ? (change / previous) * 100 : 0

    let trend: "up" | "down" | "stable" = "stable"
    if (Math.abs(percentChange) > 1) {
      trend = inverted ? (change > 0 ? "down" : "up") : change > 0 ? "up" : "down"
    }

    return {
      value: current,
      change: percentChange,
      trend,
    }
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-600" />
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-600" />
      case "stable":
        return <Activity className="w-3 h-3 text-gray-600" />
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      case "stable":
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-4">
      {/* Real-time Status Indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
        <span className="text-sm font-medium">{isRunning ? "Live Updates" : "Paused"}</span>
        {isRunning && <Zap className="w-4 h-4 text-yellow-500" />}
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">System Efficiency</div>
              <div className="text-lg font-bold">{trends.efficiency.value.toFixed(1)}%</div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(trends.efficiency.trend)}
              <span className={`text-xs ${getTrendColor(trends.efficiency.trend)}`}>
                {trends.efficiency.change > 0 ? "+" : ""}
                {trends.efficiency.change.toFixed(1)}%
              </span>
            </div>
          </div>
          <Progress value={trends.efficiency.value} className="h-1 mt-2" />
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Avg Wait Time</div>
              <div className="text-lg font-bold">{trends.waitTime.value.toFixed(1)}s</div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(trends.waitTime.trend)}
              <span className={`text-xs ${getTrendColor(trends.waitTime.trend)}`}>
                {trends.waitTime.change > 0 ? "+" : ""}
                {trends.waitTime.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Throughput</div>
              <div className="text-lg font-bold">{trends.throughput.value.toFixed(0)}/min</div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(trends.throughput.trend)}
              <span className={`text-xs ${getTrendColor(trends.throughput.trend)}`}>
                {trends.throughput.change > 0 ? "+" : ""}
                {trends.throughput.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Network Activity */}
      <Card className="p-3">
        <div className="text-xs text-muted-foreground mb-2">Network Activity</div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Active Proposals</span>
            <Badge variant="secondary" className="text-xs">
              {metrics.activeProposals}
            </Badge>
          </div>
          <div className="flex justify-between text-xs">
            <span>Consensus Rate</span>
            <Badge variant={metrics.consensusRate > 80 ? "default" : "secondary"} className="text-xs">
              {metrics.consensusRate.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
