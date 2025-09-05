import type React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
  children?: React.ReactNode
}

export function SkeletonCard({ className, children }: SkeletonCardProps) {
  return (
    <Card className={cn("p-4 animate-pulse", className)}>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
        {children}
      </div>
    </Card>
  )
}
