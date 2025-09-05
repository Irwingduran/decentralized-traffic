"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

interface PerformanceData {
  timestamp: number
  efficiency: number
  avgWaitTime: number
  throughput: number
  aiOptimizations: number
}

interface PerformanceChartsProps {
  data: PerformanceData[]
  currentMetrics: {
    efficiency: number
    avgWaitTime: number
    throughput: number
  }
}

export function PerformanceCharts({ data, currentMetrics }: PerformanceChartsProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getEfficiencyTrend = () => {
    if (data.length < 2) return 0
    const recent = data.slice(-5)
    const first = recent[0]?.efficiency || 0
    const last = recent[recent.length - 1]?.efficiency || 0
    return last - first
  }

  const getThroughputTrend = () => {
    if (data.length < 2) return 0
    const recent = data.slice(-5)
    const first = recent[0]?.throughput || 0
    const last = recent[recent.length - 1]?.throughput || 0
    return last - first
  }

  const efficiencyTrend = getEfficiencyTrend()
  const throughputTrend = getThroughputTrend()

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Efficiency</p>
              <p className="text-2xl font-bold">{currentMetrics.efficiency.toFixed(1)}%</p>
            </div>
            <div className="flex items-center gap-1">
              {efficiencyTrend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <Badge variant={efficiencyTrend > 0 ? "default" : "destructive"}>
                {efficiencyTrend > 0 ? "+" : ""}
                {efficiencyTrend.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              <p className="text-2xl font-bold">{currentMetrics.avgWaitTime.toFixed(1)}s</p>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <Badge variant="secondary">Real-time</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Throughput</p>
              <p className="text-2xl font-bold">{currentMetrics.throughput.toFixed(0)}/min</p>
            </div>
            <div className="flex items-center gap-1">
              {throughputTrend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <Badge variant={throughputTrend > 0 ? "default" : "destructive"}>
                {throughputTrend > 0 ? "+" : ""}
                {throughputTrend.toFixed(0)}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Efficiency Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Efficiency Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => formatTime(value as number)}
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Efficiency"]}
            />
            <Area type="monotone" dataKey="efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Wait Time vs Throughput</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(value) => formatTime(value as number)} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgWaitTime"
                stroke="#ef4444"
                strokeWidth={2}
                name="Avg Wait Time (s)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="throughput"
                stroke="#10b981"
                strokeWidth={2}
                name="Throughput (/min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI Optimizations Applied</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => formatTime(value as number)}
                formatter={(value: number) => [value, "Optimizations"]}
              />
              <Bar dataKey="aiOptimizations" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
