"use client"

import type { TrafficNode } from "@/lib/types"
import { NodeCard } from "./NodeCard"
import { Card } from "@/components/ui/card"

interface NodeGridProps {
  nodes: Map<string, TrafficNode>
  onNodeClick: (nodeId: string) => void
}

export function NodeGrid({ nodes, onNodeClick }: NodeGridProps) {
  const nodeArray = Array.from(nodes.values())

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Traffic Node Network (16 Nodes)</h2>
      <div className="grid grid-cols-4 gap-3">
        {nodeArray.map((node) => (
          <NodeCard key={node.id} node={node} onClick={() => onNodeClick(node.id)} />
        ))}
      </div>
    </Card>
  )
}
