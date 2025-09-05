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
  ComposedChart,
  Bar,
} from "recharts"
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react"

interface EfficiencyData {
  timestamp: number
  efficiency: number
  optimizationsApplied: number
  energySaved: number
  co2Reduced: number
}

interface EfficiencyTrendsProps {
  data: EfficiencyData[]
  targetEfficiency: number
}

export function EfficiencyTrends({ data, targetEfficiency = 90 }: EfficiencyTrendsProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const currentEfficiency = data[data.length - 1]?.efficiency || 0
  const previousEfficiency = data[data.length - 2]?.efficiency || 0
  const efficiencyChange = currentEfficiency - previousEfficiency

  const totalOptimizations = data.reduce((sum, d) => sum + d.optimizationsApplied, 0)
  const totalEnergySaved = data.reduce((sum, d) => sum + d.energySaved, 0)
  const totalCO2Reduced = data.reduce((sum, d) => sum + d.co2Reduced, 0)

  const isOnTarget = currentEfficiency >= targetEfficiency
  const progressToTarget = (currentEfficiency / targetEfficiency) * 100

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Efficiency</p>
              <p className="text-2xl font-bold">{currentEfficiency.toFixed(1)}%</p>
            </div>
            <div className="flex items-center gap-1">
              {efficiencyChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <Badge variant={efficiencyChange > 0 ? "default" : "destructive"}>
                {efficiencyChange > 0 ? "+" : ""}
                {efficiencyChange.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Target Progress</p>
              <p className="text-2xl font-bold">{progressToTarget.toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Energy Saved</p>
              <p className="text-2xl font-bold">{totalEnergySaved.toFixed(1)} kWh</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              CO₂
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CO₂ Reduced</p>
              <p className="text-2xl font-bold">{totalCO2Reduced.toFixed(1)} kg</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Efficiency Trend with Target Line */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Efficiency Trend vs Target</h3>
          <Badge variant={isOnTarget ? "default" : "secondary"}>{isOnTarget ? "On Target" : "Below Target"}</Badge>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => formatTime(value as number)}
              formatter={(value: number, name: string) => [
                name === "efficiency" ? `${value.toFixed(1)}%` : value,
                name === "efficiency" ? "Efficiency" : "Target",
              ]}
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            />
            {/* Target line */}
            <Line
              type="monotone"
              dataKey={() => targetEfficiency}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Optimization Impact */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Optimization Impact</h3>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip labelFormatter={(value) => formatTime(value as number)} />
            <Bar
              yAxisId="left"
              dataKey="optimizationsApplied"
              fill="#8b5cf6"
              name="Optimizations Applied"
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiency"
              stroke="#10b981"
              strokeWidth={2}
              name="Efficiency %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Environmental Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Savings Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => formatTime(value as number)}
                formatter={(value: number) => [`${value.toFixed(1)} kWh`, "Energy Saved"]}
              />
              <Line type="monotone" dataKey="energySaved" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Carbon Footprint Reduction</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => formatTime(value as number)}
                formatter={(value: number) => [`${value.toFixed(1)} kg`, "CO₂ Reduced"]}
              />
              <Line type="monotone" dataKey="co2Reduced" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{totalOptimizations}</div>
            <div className="text-sm text-muted-foreground">Total AI Optimizations</div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {(((currentEfficiency - 70) / 30) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Improvement from Baseline</div>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {(totalOptimizations / (data.length || 1)).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Optimizations per Hour</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
