"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TrafficPattern } from "@/lib/types"
import { TRAFFIC_PATTERNS } from "@/lib/constants"

interface TrafficControlsProps {
  isRunning: boolean
  currentPattern: TrafficPattern
  onToggleSimulation: () => void
  onResetSimulation: () => void
  onPatternChange: (patternId: string) => void
}

export function TrafficControls({
  isRunning,
  currentPattern,
  onToggleSimulation,
  onResetSimulation,
  onPatternChange,
}: TrafficControlsProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={onToggleSimulation} variant={isRunning ? "secondary" : "default"}>
            {isRunning ? "Pause" : "Start"} Simulation
          </Button>
          <Button onClick={onResetSimulation} variant="outline">
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Pattern:</label>
          <Select value={currentPattern.id} onValueChange={onPatternChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRAFFIC_PATTERNS.map((pattern) => (
                <SelectItem key={pattern.id} value={pattern.id}>
                  {pattern.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}
