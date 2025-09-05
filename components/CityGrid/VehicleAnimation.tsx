"use client"

import { useEffect, useState } from "react"
import type { Vehicle, Direction, VehicleType } from "@/lib/types"
import { generateId } from "@/lib/utils/simulation"
import { VEHICLE_SPEED, INTERSECTION_SPACING } from "@/lib/constants"

interface VehicleAnimationProps {
  isRunning: boolean
  trafficMultipliers: Record<Direction, number>
  onVehicleUpdate: (vehicles: Map<string, Vehicle>) => void
}

export function VehicleAnimation({ isRunning, trafficMultipliers, onVehicleUpdate }: VehicleAnimationProps) {
  const [vehicles, setVehicles] = useState<Map<string, Vehicle>>(new Map())

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setVehicles((prev) => {
        const newVehicles = new Map(prev)

        // Spawn new vehicles based on traffic pattern
        Object.entries(trafficMultipliers).forEach(([direction, multiplier]) => {
          if (Math.random() < 0.1 * multiplier) {
            // Spawn probability
            spawnVehicle(newVehicles, direction as Direction)
          }
        })

        // Update existing vehicles
        newVehicles.forEach((vehicle, id) => {
          updateVehiclePosition(vehicle)

          // Remove vehicles that have left the canvas
          if (isVehicleOffCanvas(vehicle)) {
            newVehicles.delete(id)
          }
        })

        onVehicleUpdate(newVehicles)
        return newVehicles
      })
    }, 100) // Update every 100ms

    return () => clearInterval(interval)
  }, [isRunning, trafficMultipliers, onVehicleUpdate])

  const spawnVehicle = (vehicles: Map<string, Vehicle>, direction: Direction) => {
    const types: VehicleType[] = ["car", "car", "car", "truck", "bus"] // Weighted towards cars
    const type = types[Math.floor(Math.random() * types.length)]

    const vehicle: Vehicle = {
      id: generateId("vehicle"),
      x: getSpawnX(direction),
      y: getSpawnY(direction),
      direction,
      speed: VEHICLE_SPEED[type],
      route: generateRoute(direction),
      waitTime: 0,
      type,
      targetIntersection: "",
    }

    vehicles.set(vehicle.id, vehicle)
  }

  const getSpawnX = (direction: Direction): number => {
    switch (direction) {
      case "east":
        return -10
      case "west":
        return 490
      case "north":
      case "south":
        return Math.floor(Math.random() * 4) * INTERSECTION_SPACING + 50
    }
  }

  const getSpawnY = (direction: Direction): number => {
    switch (direction) {
      case "north":
        return 490
      case "south":
        return -10
      case "east":
      case "west":
        return Math.floor(Math.random() * 4) * INTERSECTION_SPACING + 50
    }
  }

  const generateRoute = (direction: Direction): string[] => {
    // Simple route generation - vehicles travel straight across
    const route: string[] = []

    if (direction === "east" || direction === "west") {
      const row = Math.floor(Math.random() * 4)
      for (let col = 0; col < 4; col++) {
        route.push(`${row}-${col}`)
      }
    } else {
      const col = Math.floor(Math.random() * 4)
      for (let row = 0; row < 4; row++) {
        route.push(`${row}-${col}`)
      }
    }

    return route
  }

  const updateVehiclePosition = (vehicle: Vehicle) => {
    switch (vehicle.direction) {
      case "east":
        vehicle.x += vehicle.speed
        break
      case "west":
        vehicle.x -= vehicle.speed
        break
      case "north":
        vehicle.y -= vehicle.speed
        break
      case "south":
        vehicle.y += vehicle.speed
        break
    }
  }

  const isVehicleOffCanvas = (vehicle: Vehicle): boolean => {
    return vehicle.x < -20 || vehicle.x > 520 || vehicle.y < -20 || vehicle.y > 520
  }

  return null // This component doesn't render anything directly
}
