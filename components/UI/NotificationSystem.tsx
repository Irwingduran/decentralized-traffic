"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react"
import type { SimulationEvent } from "@/lib/utils/realtime"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "error"
  title: string
  message: string
  timestamp: number
  autoHide?: boolean
}

interface NotificationSystemProps {
  events: SimulationEvent[]
}

export function NotificationSystem({ events }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    events.forEach((event) => {
      const notification = createNotificationFromEvent(event)
      if (notification) {
        addNotification(notification)
      }
    })
  }, [events])

  const createNotificationFromEvent = (event: SimulationEvent): Notification | null => {
    switch (event.type) {
      case "consensus_reached":
        return {
          id: `consensus-${event.timestamp}`,
          type: "success",
          title: "Consensus Reached",
          message: `Proposal for intersection ${event.intersectionId} has been approved`,
          timestamp: event.timestamp,
          autoHide: true,
        }

      case "proposal_created":
        return {
          id: `proposal-${event.timestamp}`,
          type: "info",
          title: "New Proposal",
          message: `AI node submitted optimization proposal for intersection ${event.intersectionId}`,
          timestamp: event.timestamp,
          autoHide: true,
        }

      case "light_change":
        // Only notify for significant changes or patterns
        return null

      case "vehicle_completed":
        if (event.totalWaitTime && event.totalWaitTime > 60) {
          return {
            id: `delay-${event.timestamp}`,
            type: "warning",
            title: "High Wait Time Detected",
            message: `Vehicle experienced ${event.totalWaitTime.toFixed(1)}s wait time`,
            timestamp: event.timestamp,
            autoHide: true,
          }
        }
        return null

      default:
        return null
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => {
      // Prevent duplicate notifications
      if (prev.some((n) => n.id === notification.id)) return prev

      const newNotifications = [notification, ...prev].slice(0, 5) // Keep only 5 most recent

      // Auto-hide notifications after 5 seconds
      if (notification.autoHide) {
        setTimeout(() => {
          removeNotification(notification.id)
        }, 5000)
      }

      return newNotifications
    })
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "error":
        return <X className="w-4 h-4 text-red-600" />
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getBorderColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "border-l-green-500"
      case "warning":
        return "border-l-yellow-500"
      case "error":
        return "border-l-red-500"
      case "info":
        return "border-l-blue-500"
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 border-l-4 ${getBorderColor(notification.type)} animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
