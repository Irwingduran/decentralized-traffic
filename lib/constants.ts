// Constants and configuration for the traffic management system

export const GRID_SIZE = 4 // 4x4 intersection grid
export const INTERSECTION_SPACING = 120 // Pixels between intersections
export const CANVAS_WIDTH = GRID_SIZE * INTERSECTION_SPACING + 100
export const CANVAS_HEIGHT = GRID_SIZE * INTERSECTION_SPACING + 100

// Traffic light timing defaults (in seconds)
export const DEFAULT_TIMING: { ns: number; ew: number; allRed: number } = {
  ns: 30,
  ew: 30,
  allRed: 3,
}

// Consensus requirements
export const CONSENSUS_THRESHOLD = 0.66 // 66% approval required
export const MIN_NEIGHBORING_VOTES = 3

// Vehicle simulation parameters
export const VEHICLE_SPAWN_RATE = 0.3 // Probability per frame
export const VEHICLE_SPEED = {
  car: 2,
  truck: 1.5,
  bus: 1.8,
}

// AI parameters
export const AI_UPDATE_INTERVAL = 10000 // 10 seconds
export const MIN_CONFIDENCE_THRESHOLD = 0.7
export const MIN_IMPROVEMENT_THRESHOLD = 5 // 5% minimum improvement

// Traffic patterns
export const TRAFFIC_PATTERNS = [
  {
    id: "normal",
    name: "Normal Traffic",
    description: "Balanced traffic flow in all directions",
    multipliers: { north: 1, south: 1, east: 1, west: 1 },
    duration: 60,
  },
  {
    id: "rush_hour",
    name: "Rush Hour",
    description: "Heavy traffic with north-south preference",
    multipliers: { north: 2.5, south: 2.5, east: 1.2, west: 1.2 },
    duration: 30,
  },
  {
    id: "event",
    name: "Special Event",
    description: "High east-west traffic to event venue",
    multipliers: { north: 0.8, south: 0.8, east: 3, west: 1.5 },
    duration: 45,
  },
  {
    id: "accident",
    name: "Accident Response",
    description: "Reduced capacity with detour traffic",
    multipliers: { north: 0.5, south: 2, east: 1.8, west: 0.7 },
    duration: 20,
  },
]

// Color scheme for traffic visualization
export const COLORS = {
  intersection: "#374151",
  road: "#6B7280",
  vehicle: {
    car: "#3B82F6",
    truck: "#EF4444",
    bus: "#10B981",
  },
  light: {
    red: "#DC2626",
    yellow: "#F59E0B",
    green: "#16A34A",
    off: "#4B5563",
  },
  node: {
    online: "#10B981",
    offline: "#6B7280",
    malicious: "#DC2626",
  },
}
