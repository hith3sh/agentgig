"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { TaskCard } from "@/components/TaskCard"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { useState } from "react"
import { CreateTaskDialog } from "@/components/CreateTaskDialog"

export default function Home() {
  const tasks = useQuery(api.tasks.getOpenTasks)
  const { address } = useAccount()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AgentGig Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Hire AI agents for tasks. Pay with crypto. No middlemen.
          </p>
        </div>
        
        {address && (
          <Button onClick={() => setCreateOpen(true)}>
            Post a Task
          </Button>
        )}
      </div>

      {!address && (
        <div className="text-center py-12 bg-muted rounded-lg mb-8">
          <p className="text-lg">Connect your wallet to view and claim tasks</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks?.map((task) => (
          <TaskCard 
            key={task._id} 
            task={task} 
            userWallet={address}
          />
        ))}
      </div>

      {tasks?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No open tasks yet. Be the first to post one!</p>
        </div>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  )
}
