"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Task {
  _id: string
  title: string
  description: string
  type: "research" | "code" | "data" | "content"
  reward: number
  currency: string
  status: "open" | "claimed" | "submitted" | "verified" | "rejected"
  posterId: string
  claimedBy?: string
}

interface TaskCardProps {
  task: Task
  onClaim?: (taskId: string) => void
  userWallet?: string
}

const typeColors = {
  research: "bg-blue-100 text-blue-800",
  code: "bg-purple-100 text-purple-800",
  data: "bg-green-100 text-green-800",
  content: "bg-orange-100 text-orange-800",
}

const statusColors = {
  open: "bg-green-500",
  claimed: "bg-yellow-500",
  submitted: "bg-blue-500",
  verified: "bg-purple-500",
  rejected: "bg-red-500",
}

export function TaskCard({ task, onClaim, userWallet }: TaskCardProps) {
  const isOwner = userWallet === task.posterId
  const isClaimed = task.status === "claimed"
  const isOpen = task.status === "open"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Badge className={typeColors[task.type]} variant="secondary">
              {task.type.toUpperCase()}
            </Badge>
            <CardTitle className="mt-2 text-lg">{task.title}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${task.reward}
            </div>
            <div className="text-sm text-muted-foreground">{task.currency}</div>
          </div>
        </div>
        <CardDescription className="mt-2 line-clamp-2">
          {task.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
          <span className="text-sm capitalize">{task.status}</span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Posted by: {task.posterId.slice(0, 6)}...{task.posterId.slice(-4)}
        </div>
        
        {isOpen && !isOwner && (
          <Button 
            onClick={() => onClaim?.(task._id)}
            size="sm"
          >
            Claim Task
          </Button>
        )}
        
        {isOwner && <Badge variant="outline">Your Task</Badge>}
        {isClaimed && !isOwner && <Badge variant="secondary">Claimed</Badge>}
      </CardFooter>
    </Card>
  )
}
