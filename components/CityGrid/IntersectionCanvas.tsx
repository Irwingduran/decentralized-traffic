"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import type { Intersection, Vehicle, TrafficPattern, SimulationState } from "@/lib/types"
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRID_SIZE, INTERSECTION_SPACING } from "@/lib/constants"
import { TrafficSimulationEngine, type SimulationEvent } from "@/lib/utils/realtime"

interface IntersectionCanvasProps {
  intersections: Map<string, Intersection>
  vehicles: Map<string, Vehicle>
  isRunning: boolean
  trafficPattern: TrafficPattern
  onIntersectionClick: (intersectionId: string) => void
  onStateUpdate: (update: { intersections: Map<string, Intersection>; vehicles: Map<string, Vehicle> }) => void
  onEvents: (events: SimulationEvent[]) => void
}

export function IntersectionCanvas({
  intersections,
  vehicles,
  isRunning,
  trafficPattern,
  onIntersectionClick,
  onStateUpdate,
  onEvents,
}: IntersectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<TrafficSimulationEngine>()
  const [hoveredIntersection, setHoveredIntersection] = useState<string | null>(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TrafficSimulationEngine(
        (update) => {
          // Handle state updates from engine
        },
        (event) => {
          // Handle simulation events
          onEvents([event])
        },
      )
    }

    if (isRunning) {
      engineRef.current.start()
    } else {
      engineRef.current.stop()
    }

    return () => {
      engineRef.current?.stop()
    }
  }, [isRunning, onEvents])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdateRef.current
      lastUpdateRef.current = timestamp

      if (isRunning && engineRef.current && deltaTime > 0) {
        // Update simulation state
        const simulationState: SimulationState = {
          isRunning,
          currentTime: Date.now(),
          intersections,
          vehicles,
          nodes: new Map(),
          proposals: new Map(),
          metrics: {
            averageWaitTime: 0,
            totalThroughput: 0,
            systemEfficiency: 0,
            activeProposals: 0,
            consensusRate: 0,
          },
          currentPattern: trafficPattern,
        }

        const {
          intersections: newIntersections,
          vehicles: newVehicles,
          events,
        } = engineRef.current.updateSimulation(simulationState, deltaTime / 1000)

        // Update parent state
        onStateUpdate({
          intersections: newIntersections,
          vehicles: newVehicles,
        })

        // Send events to parent
        if (events.length > 0) {
          onEvents(events)
        }
      }

      // Draw the scene
      draw(ctx)

      if (isRunning) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [intersections, vehicles, isRunning, trafficPattern, hoveredIntersection, onStateUpdate, onEvents])

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas with dark background
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw roads
    drawRoads(ctx)

    // Draw intersections with enhanced visuals
    intersections.forEach((intersection) => {
      drawIntersection(ctx, intersection, intersection.id === hoveredIntersection)
    })

    // Draw vehicles with improved animation
    vehicles.forEach((vehicle) => {
      drawVehicle(ctx, vehicle)
    })

    // Draw grid overlay for better visibility
    drawGrid(ctx)
  }

  const drawRoads = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = COLORS.road
    ctx.lineWidth = 12

    // Horizontal roads with lane markings
    for (let row = 0; row < GRID_SIZE; row++) {
      const y = row * INTERSECTION_SPACING + 50
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()

      // Lane dividers
      ctx.strokeStyle = "#9CA3AF"
      ctx.lineWidth = 1
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = COLORS.road
      ctx.lineWidth = 12
    }

    // Vertical roads with lane markings
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = col * INTERSECTION_SPACING + 50
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()

      // Lane dividers
      ctx.strokeStyle = "#9CA3AF"
      ctx.lineWidth = 1
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = COLORS.road
      ctx.lineWidth = 12
    }
  }

  const drawIntersection = (ctx: CanvasRenderingContext2D, intersection: Intersection, isHovered: boolean) => {
    const { x, y, lightState, queue } = intersection

    // Draw intersection with glow effect
    if (isHovered) {
      ctx.shadowColor = "#3B82F6"
      ctx.shadowBlur = 10
    }

    ctx.fillStyle = isHovered ? "#475569" : COLORS.intersection
    ctx.beginPath()
    ctx.arc(x, y, 18, 0, 2 * Math.PI)
    ctx.fill()

    ctx.shadowBlur = 0

    // Enhanced traffic lights with realistic positioning
    const lightSize = 8
    const lightOffset = 25

    // North-South lights
    const nsColor =
      lightState === "ns_green" ? COLORS.light.green : lightState === "all_red" ? COLORS.light.red : COLORS.light.red

    // Add glow effect for active lights
    if (lightState === "ns_green") {
      ctx.shadowColor = COLORS.light.green
      ctx.shadowBlur = 8
    }

    ctx.fillStyle = nsColor
    ctx.fillRect(x - lightSize / 2, y - lightOffset, lightSize, lightSize)
    ctx.fillRect(x - lightSize / 2, y + lightOffset - lightSize, lightSize, lightSize)

    ctx.shadowBlur = 0

    // East-West lights
    const ewColor =
      lightState === "ew_green" ? COLORS.light.green : lightState === "all_red" ? COLORS.light.red : COLORS.light.red

    if (lightState === "ew_green") {
      ctx.shadowColor = COLORS.light.green
      ctx.shadowBlur = 8
    }

    ctx.fillStyle = ewColor
    ctx.fillRect(x - lightOffset, y - lightSize / 2, lightSize, lightSize)
    ctx.fillRect(x + lightOffset - lightSize, y - lightSize / 2, lightSize, lightSize)

    ctx.shadowBlur = 0

    // Enhanced queue indicators
    if (queue.north > 0) drawQueueIndicator(ctx, x, y - 40, queue.north, "north")
    if (queue.south > 0) drawQueueIndicator(ctx, x, y + 40, queue.south, "south")
    if (queue.east > 0) drawQueueIndicator(ctx, x + 40, y, queue.east, "east")
    if (queue.west > 0) drawQueueIndicator(ctx, x - 40, y, queue.west, "west")
  }

  const drawQueueIndicator = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    count: number,
    direction: string,
  ) => {
    // Background circle
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)"
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, 2 * Math.PI)
    ctx.fill()

    // Queue count text
    ctx.fillStyle = "white"
    ctx.font = "bold 10px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(count.toString(), x, y)
  }

  const drawVehicle = (ctx: CanvasRenderingContext2D, vehicle: Vehicle) => {
    const { x, y, type, direction } = vehicle

    ctx.fillStyle = COLORS.vehicle[type]

    // Enhanced vehicle rendering with proper dimensions
    const width = type === "truck" ? 12 : type === "bus" ? 14 : 8
    const height = 6

    ctx.save()
    ctx.translate(x, y)

    // Rotate based on direction
    switch (direction) {
      case "north":
        ctx.rotate(-Math.PI / 2)
        break
      case "south":
        ctx.rotate(Math.PI / 2)
        break
      case "east":
        ctx.rotate(0)
        break
      case "west":
        ctx.rotate(Math.PI)
        break
    }

    // Draw vehicle body
    ctx.fillRect(-width / 2, -height / 2, width, height)

    // Add vehicle details
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(-width / 2 + 1, -height / 2 + 1, width - 2, 1) // Windshield
    ctx.fillRect(-width / 2 + 1, height / 2 - 2, width - 2, 1) // Rear window

    ctx.restore()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
    ctx.lineWidth = 1

    // Grid lines for reference
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * INTERSECTION_SPACING + 50

      // Vertical lines
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, CANVAS_HEIGHT)
      ctx.stroke()

      // Horizontal lines
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(CANVAS_WIDTH, pos)
      ctx.stroke()
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked intersection
    intersections.forEach((intersection) => {
      const distance = Math.sqrt(Math.pow(x - intersection.x, 2) + Math.pow(y - intersection.y, 2))
      if (distance <= 25) {
        onIntersectionClick(intersection.id)
      }
    })
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    let foundIntersection: string | null = null
    intersections.forEach((intersection) => {
      const distance = Math.sqrt(Math.pow(x - intersection.x, 2) + Math.pow(y - intersection.y, 2))
      if (distance <= 25) {
        foundIntersection = intersection.id
      }
    })

    setHoveredIntersection(foundIntersection)
  }

  return (
    <div className="relative border border-border rounded-lg overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredIntersection(null)}
      />
    </div>
  )
}
