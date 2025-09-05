"use client"

import type { SystemMetrics } from "@/lib/types"
import { Card } from "@/components/ui/card"

interface MetricsOverlayProps {
  metrics: SystemMetrics
}

export function MetricsOverlay({ metrics }: MetricsOverlayProps) {
  return (
    <div className="absolute top-4 right-4 space-y-2">
      <Card className="p-3 bg-background/90 backdrop-blur-sm">
        <div className="text-xs space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Efficiency:</span>
            <span className="font-medium text-green-600">{metrics.systemEfficiency.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Avg Wait:</span>
            <span className="font-medium">{metrics.averageWaitTime.toFixed(1)}s</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Throughput:</span>
            <span className="font-medium">{metrics.totalThroughput.toFixed(0)}/min</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
