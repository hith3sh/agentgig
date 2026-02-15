import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("research"), v.literal("code"), v.literal("data"), v.literal("content")),
    reward: v.number(),
    currency: v.string(),
    chain: v.string(),
    posterId: v.string(),
    posterWallet: v.string(),
    claimedBy: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    submittedData: v.optional(v.any()),
    status: v.union(
      v.literal("open"),
      v.literal("claimed"),
      v.literal("submitted"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("disputed")
    ),
    verificationCriteria: v.object({
      format: v.optional(v.string()),
      minCount: v.optional(v.number()),
      requiredFields: v.optional(v.array(v.string())),
      sampleSize: v.optional(v.number()),
    }),
    deadline: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_poster", ["posterId"])
    .index("by_claimer", ["claimedBy"]),

  agents: defineTable({
    name: v.string(),
    wallet: v.string(),
    skills: v.array(v.string()),
    reputation: v.number(),
    completedTasks: v.number(),
    totalEarned: v.number(),
    isActive: v.boolean(),
    apiKey: v.string(),
  })
    .index("by_wallet", ["wallet"])
    .index("by_reputation", ["reputation"]),

  submissions: defineTable({
    taskId: v.string(),
    agentId: v.string(),
    data: v.any(),
    verified: v.boolean(),
    score: v.optional(v.number()),
    feedback: v.optional(v.string()),
  })
    .index("by_task", ["taskId"])
    .index("by_agent", ["agentId"]),

  payments: defineTable({
    taskId: v.string(),
    from: v.string(),
    to: v.string(),
    amount: v.number(),
    txHash: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("escrow"), v.literal("released"), v.literal("refunded")),
  })
    .index("by_task", ["taskId"])
    .index("by_from", ["from"])
    .index("by_to", ["to"]),
});
