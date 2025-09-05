"use client"

import type { LightState } from "@/lib/types"
import { COLORS } from "@/lib/constants"

interface TrafficLightProps {
  state: LightState
  size?: number
  className?: string
}

export function TrafficLight({ state, size = 12, className = "" }: TrafficLightProps) {
  const getColor = () => {
    switch (state) {
      case "ns_green":
        return COLORS.light.green
      case "ew_green":
        return COLORS.light.green
      case "all_red":
        return COLORS.light.red
      default:
        return COLORS.light.off
    }
  }

  return (
    <div
      className={`rounded-full border-2 border-gray-600 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: getColor(),
        boxShadow: `0 0 ${size / 2}px ${getColor()}40`,
      }}
    />
  )
}
