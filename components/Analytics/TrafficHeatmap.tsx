"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Intersection, TrafficPattern } from "@/lib/types"
import { GRID_SIZE } from "@/lib/constants"
import { Thermometer, Activity, Clock } from "lucide-react"

interface TrafficHeatmapProps {
  intersections: Map<string, Intersection>
  currentPattern: TrafficPattern
  patternHistory: Array<{
    pattern: string
    timestamp: number
    efficiency: number
  }>
}

export function TrafficHeatmap({ intersections, currentPattern, patternHistory }: TrafficHeatmapProps) {
  const intersectionArray = Array.from(intersections.values())

  // Calculate heat values based on queue lengths and wait times
  const getHeatValue = (intersection: Intersection): number => {
    const totalQueue =
      intersection.queue.north + intersection.queue.south + intersection.queue.east + intersection.queue.west
    const waitFactor = intersection.averageWait / 60 // Normalize to 0-1
    const queueFactor = Math.min(totalQueue / 20, 1) // Normalize to 0-1
    return (waitFactor + queueFactor) / 2
  }

  const getHeatColor = (heatValue: number): string => {
    if (heatValue < 0.2) return "bg-green-500"
    if (heatValue < 0.4) return "bg-yellow-500"
    if (heatValue < 0.6) return "bg-orange-500"
    if (heatValue < 0.8) return "bg-red-500"
    return "bg-red-700"
  }

  const getHeatIntensity = (heatValue: number): string => {
    const opacity = Math.max(0.3, Math.min(1, heatValue))
    return `opacity-${Math.round(opacity * 100)}`
  }

  // Pattern recognition data
  const patternStats = patternHistory.reduce(
    (acc, entry) => {
      acc[entry.pattern] = (acc[entry.pattern] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const mostCommonPattern = Object.entries(patternStats).sort(([, a], [, b]) => b - a)[0]?.[0] || "normal"

  // Calculate congestion hotspots
  const hotspots = intersectionArray
    .map((intersection) => ({
      id: intersection.id,
      heat: getHeatValue(intersection),
      avgWait: intersection.averageWait,
      totalQueue:
        intersection.queue.north + intersection.queue.south + intersection.queue.east + intersection.queue.west,
    }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Pattern Recognition Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Current Pattern</p>
              <p className="font-semibold">{currentPattern.name}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Thermometer className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Hotspots Detected</p>
              <p className="font-semibold">{hotspots.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Most Common Pattern</p>
              <p className="font-semibold">{mostCommonPattern}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Heatmap Grid */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Real-time Traffic Heatmap</h3>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
              const row = Math.floor(index / GRID_SIZE)
              const col = index % GRID_SIZE
              const intersectionId = `${row}-${col}`
              const intersection = intersections.get(intersectionId)

              if (!intersection) return null

              const heatValue = getHeatValue(intersection)
              const heatColor = getHeatColor(heatValue)

              return (
                <div
                  key={intersectionId}
                  className={`aspect-square rounded-lg ${heatColor} flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:scale-105 transition-transform`}
                  title={`${intersectionId}: ${intersection.averageWait.toFixed(1)}s wait, ${intersection.queue.north + intersection.queue.south + intersection.queue.east + intersection.queue.west} queued`}
                >
                  {intersectionId}
                </div>
              )
            })}
          </div>

          {/* Heat Legend */}
          <div className="flex items-center justify-between text-xs">
            <span>Low Traffic</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div className="w-4 h-4 bg-red-700 rounded"></div>
            </div>
            <span>High Traffic</span>
          </div>
        </Card>

        {/* Congestion Hotspots */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Congestion Hotspots</h3>

          <div className="space-y-3">
            {hotspots.map((hotspot, index) => (
              <div key={hotspot.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 2 ? "destructive" : "secondary"}>#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">Intersection {hotspot.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {hotspot.avgWait.toFixed(1)}s avg wait • {hotspot.totalQueue} vehicles queued
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{(hotspot.heat * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">congestion</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pattern Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Pattern Analysis</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Current Pattern Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pattern:</span>
                <span className="font-medium">{currentPattern.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{currentPattern.duration} minutes</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">{currentPattern.description}</div>
            </div>

            <div className="mt-4">
              <h5 className="font-medium mb-2">Traffic Multipliers</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>North:</span>
                  <span className="font-medium">{currentPattern.multipliers.north}x</span>
                </div>
                <div className="flex justify-between">
                  <span>South:</span>
                  <span className="font-medium">{currentPattern.multipliers.south}x</span>
                </div>
                <div className="flex justify-between">
                  <span>East:</span>
                  <span className="font-medium">{currentPattern.multipliers.east}x</span>
                </div>
                <div className="flex justify-between">
                  <span>West:</span>
                  <span className="font-medium">{currentPattern.multipliers.west}x</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Pattern History</h4>
            <div className="space-y-2">
              {Object.entries(patternStats)
                .sort(([, a], [, b]) => b - a)
                .map(([pattern, count]) => (
                  <div key={pattern} className="flex items-center justify-between">
                    <span className="capitalize">{pattern}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(patternStats))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
