// Real-time simulation engine for traffic management system

import type { Intersection, Vehicle, SimulationState, LightState } from "../types"
import { generateId } from "./simulation"
import { VEHICLE_SPEED, INTERSECTION_SPACING } from "../constants"

export class TrafficSimulationEngine {
  private animationFrame: number | null = null
  private lastUpdate = 0
  private vehicleSpawnTimer = 0

  constructor(
    private onStateUpdate: (update: Partial<SimulationState>) => void,
    private onEvent: (event: SimulationEvent) => void,
  ) {}

  start() {
    if (this.animationFrame) return
    this.lastUpdate = performance.now()
    this.tick()
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  private tick = () => {
    const now = performance.now()
    const deltaTime = now - this.lastUpdate
    this.lastUpdate = now

    // Update at 60 FPS
    if (deltaTime >= 16.67) {
      this.update(deltaTime / 1000) // Convert to seconds
    }

    this.animationFrame = requestAnimationFrame(this.tick)
  }

  private update(deltaTime: number) {
    // This will be called by the main component with current state
  }

  updateSimulation(
    state: SimulationState,
    deltaTime: number,
  ): {
    intersections: Map<string, Intersection>
    vehicles: Map<string, Vehicle>
    events: SimulationEvent[]
  } {
    const events: SimulationEvent[] = []
    const newIntersections = new Map(state.intersections)
    const newVehicles = new Map(state.vehicles)

    // Update traffic lights
    this.updateTrafficLights(newIntersections, deltaTime, events)

    // Spawn vehicles based on traffic pattern
    this.spawnVehicles(newVehicles, state.currentPattern, deltaTime, events)

    // Update vehicle positions and handle intersections
    this.updateVehicles(newVehicles, newIntersections, deltaTime, events)

    // Update intersection metrics
    this.updateIntersectionMetrics(newIntersections, newVehicles)

    return {
      intersections: newIntersections,
      vehicles: newVehicles,
      events,
    }
  }

  private updateTrafficLights(intersections: Map<string, Intersection>, deltaTime: number, events: SimulationEvent[]) {
    const now = Date.now()

    intersections.forEach((intersection) => {
      const timeSinceChange = now - intersection.lastChange
      const { ns, ew, allRed } = intersection.timing

      let newState: LightState = intersection.lightState
      let shouldChange = false

      switch (intersection.lightState) {
        case "ns_green":
          if (timeSinceChange >= ns * 1000) {
            newState = "all_red"
            shouldChange = true
          }
          break
        case "all_red":
          if (timeSinceChange >= allRed * 1000) {
            // Determine next green phase based on queue lengths
            const nsQueue = intersection.queue.north + intersection.queue.south
            const ewQueue = intersection.queue.east + intersection.queue.west
            newState = nsQueue >= ewQueue ? "ns_green" : "ew_green"
            shouldChange = true
          }
          break
        case "ew_green":
          if (timeSinceChange >= ew * 1000) {
            newState = "all_red"
            shouldChange = true
          }
          break
      }

      if (shouldChange) {
        intersection.lightState = newState
        intersection.lastChange = now
        events.push({
          type: "light_change",
          intersectionId: intersection.id,
          newState,
          timestamp: now,
        })
      }
    })
  }

  private spawnVehicles(
    vehicles: Map<string, Vehicle>,
    trafficPattern: any,
    deltaTime: number,
    events: SimulationEvent[],
  ) {
    this.vehicleSpawnTimer += deltaTime

    if (this.vehicleSpawnTimer >= 2) {
      // Spawn every 2 seconds
      this.vehicleSpawnTimer = 0

      Object.entries(trafficPattern.multipliers).forEach(([direction, multiplier]) => {
        if (Math.random() < 0.3 * (multiplier as number)) {
          const vehicle = this.createVehicle(direction as any)
          vehicles.set(vehicle.id, vehicle)
          events.push({
            type: "vehicle_spawned",
            vehicleId: vehicle.id,
            direction: vehicle.direction,
            timestamp: Date.now(),
          })
        }
      })
    }
  }

  private createVehicle(direction: "north" | "south" | "east" | "west"): Vehicle {
    const types = ["car", "car", "car", "truck", "bus"] as const
    const type = types[Math.floor(Math.random() * types.length)]

    let x: number, y: number, route: string[]

    switch (direction) {
      case "north":
        x = Math.floor(Math.random() * 4) * INTERSECTION_SPACING + 50
        y = 500
        route = Array.from({ length: 4 }, (_, i) => `${3 - i}-${Math.floor((x - 50) / INTERSECTION_SPACING)}`)
        break
      case "south":
        x = Math.floor(Math.random() * 4) * INTERSECTION_SPACING + 50
        y = -20
        route = Array.from({ length: 4 }, (_, i) => `${i}-${Math.floor((x - 50) / INTERSECTION_SPACING)}`)
        break
      case "east":
        x = -20
        y = Math.floor(Math.random() * 4) * INTERSECTION_SPACING + 50
        route = Array.from({ length: 4 }, (_, i) => `${Math.floor((y - 50) / INTERSECTION_SPACING)}-${i}`)
        break
      case "west":
        x = 500
        y = Math.floor(Math.random() * 4) * INTERSECTION_SPACING + 50
        route = Array.from({ length: 4 }, (_, i) => `${Math.floor((y - 50) / INTERSECTION_SPACING)}-${3 - i}`)
        break
    }

    return {
      id: generateId("vehicle"),
      x,
      y,
      direction,
      speed: VEHICLE_SPEED[type],
      route,
      waitTime: 0,
      type,
      targetIntersection: route[0] || "",
    }
  }

  private updateVehicles(
    vehicles: Map<string, Vehicle>,
    intersections: Map<string, Intersection>,
    deltaTime: number,
    events: SimulationEvent[],
  ) {
    const toRemove: string[] = []

    vehicles.forEach((vehicle) => {
      const nearestIntersection = this.findNearestIntersection(vehicle, intersections)

      if (nearestIntersection) {
        const distance = Math.sqrt(
          Math.pow(vehicle.x - nearestIntersection.x, 2) + Math.pow(vehicle.y - nearestIntersection.y, 2),
        )

        // Check if vehicle should stop at red light
        if (distance < 30 && this.shouldStop(vehicle, nearestIntersection)) {
          vehicle.waitTime += deltaTime
          this.updateQueueCount(nearestIntersection, vehicle.direction, 1)
          return
        } else {
          this.updateQueueCount(nearestIntersection, vehicle.direction, -1)
        }
      }

      // Move vehicle
      switch (vehicle.direction) {
        case "north":
          vehicle.y -= vehicle.speed
          break
        case "south":
          vehicle.y += vehicle.speed
          break
        case "east":
          vehicle.x += vehicle.speed
          break
        case "west":
          vehicle.x -= vehicle.speed
          break
      }

      // Remove vehicles that are off screen
      if (vehicle.x < -50 || vehicle.x > 550 || vehicle.y < -50 || vehicle.y > 550) {
        toRemove.push(vehicle.id)
        events.push({
          type: "vehicle_completed",
          vehicleId: vehicle.id,
          totalWaitTime: vehicle.waitTime,
          timestamp: Date.now(),
        })
      }
    })

    toRemove.forEach((id) => vehicles.delete(id))
  }

  private findNearestIntersection(vehicle: Vehicle, intersections: Map<string, Intersection>): Intersection | null {
    let nearest: Intersection | null = null
    let minDistance = Number.POSITIVE_INFINITY

    intersections.forEach((intersection) => {
      const distance = Math.sqrt(Math.pow(vehicle.x - intersection.x, 2) + Math.pow(vehicle.y - intersection.y, 2))
      if (distance < minDistance) {
        minDistance = distance
        nearest = intersection
      }
    })

    return minDistance < 50 ? nearest : null
  }

  private shouldStop(vehicle: Vehicle, intersection: Intersection): boolean {
    const { lightState } = intersection

    switch (vehicle.direction) {
      case "north":
      case "south":
        return lightState !== "ns_green"
      case "east":
      case "west":
        return lightState !== "ew_green"
      default:
        return true
    }
  }

  private updateQueueCount(intersection: Intersection, direction: string, delta: number) {
    switch (direction) {
      case "north":
        intersection.queue.north = Math.max(0, intersection.queue.north + delta)
        break
      case "south":
        intersection.queue.south = Math.max(0, intersection.queue.south + delta)
        break
      case "east":
        intersection.queue.east = Math.max(0, intersection.queue.east + delta)
        break
      case "west":
        intersection.queue.west = Math.max(0, intersection.queue.west + delta)
        break
    }
  }

  private updateIntersectionMetrics(intersections: Map<string, Intersection>, vehicles: Map<string, Vehicle>) {
    intersections.forEach((intersection) => {
      const nearbyVehicles = Array.from(vehicles.values()).filter((v) => {
        const distance = Math.sqrt(Math.pow(v.x - intersection.x, 2) + Math.pow(v.y - intersection.y, 2))
        return distance < 100
      })

      // Calculate average wait time
      const waitingVehicles = nearbyVehicles.filter((v) => v.waitTime > 0)
      intersection.averageWait =
        waitingVehicles.length > 0
          ? waitingVehicles.reduce((sum, v) => sum + v.waitTime, 0) / waitingVehicles.length
          : 0

      // Calculate throughput (vehicles per minute)
      intersection.throughput = nearbyVehicles.length * 2 // Simplified calculation
    })
  }
}

export interface SimulationEvent {
  type: "light_change" | "vehicle_spawned" | "vehicle_completed" | "proposal_created" | "consensus_reached"
  timestamp: number
  intersectionId?: string
  vehicleId?: string
  proposalId?: string
  direction?: string
  newState?: LightState
  totalWaitTime?: number
}
