import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function StatusIndicator({ status, size = "md", showLabel = false, className }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  const statusConfig = {
    online: { color: "bg-green-400", label: "Online", animate: "animate-pulse" },
    offline: { color: "bg-gray-400", label: "Offline", animate: "" },
    warning: { color: "bg-yellow-400", label: "Warning", animate: "animate-pulse" },
    error: { color: "bg-red-400", label: "Error", animate: "animate-pulse" },
  }

  const config = statusConfig[status]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("rounded-full", sizeClasses[size], config.color, config.animate)} />
      {showLabel && <span className="text-xs font-medium text-muted-foreground">{config.label}</span>}
    </div>
  )
}
