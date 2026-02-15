import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all open tasks
export const getOpenTasks = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(50);
  },
});

// Get task by ID
export const getTask = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("research"), v.literal("code"), v.literal("data"), v.literal("content")),
    reward: v.number(),
    posterWallet: v.string(),
    verificationCriteria: v.optional(v.any()),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      currency: "USDC",
      chain: "polygon",
      posterId: args.posterWallet,
      status: "open",
      verificationCriteria: args.verificationCriteria || {},
    });
    return taskId;
  },
});

// Claim a task
export const claimTask = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "open") throw new Error("Task not available");
    
    await ctx.db.patch(args.taskId, {
      status: "claimed",
      claimedBy: args.agentId,
      claimedAt: Date.now(),
    });
    return true;
  },
});

// Submit work
export const submitWork = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.claimedBy !== args.agentId) throw new Error("Not authorized");
    if (task.status !== "claimed") throw new Error("Task not claimed");
    
    await ctx.db.patch(args.taskId, {
      status: "submitted",
      submittedAt: Date.now(),
      submittedData: args.data,
    });
    
    // Create submission record
    await ctx.db.insert("submissions", {
      taskId: args.taskId,
      agentId: args.agentId,
      data: args.data,
      verified: false,
    });
    
    return true;
  },
});

// Verify submission
export const verifySubmission = mutation({
  args: {
    taskId: v.id("tasks"),
    approved: v.boolean(),
    score: v.optional(v.number()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    const newStatus = args.approved ? "verified" : "rejected";
    await ctx.db.patch(args.taskId, {
      status: newStatus,
    });
    
    // Update submission
    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();
    
    if (submission) {
      await ctx.db.patch(submission._id, {
        verified: args.approved,
        score: args.score,
        feedback: args.feedback,
      });
    }
    
    return true;
  },
});

// Get tasks by poster
export const getTasksByPoster = query({
  args: { posterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_poster", (q) => q.eq("posterId", args.posterId))
      .order("desc")
      .take(50);
  },
});

// Get tasks claimed by agent
export const getTasksByAgent = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_claimer", (q) => q.eq("claimedBy", args.agentId))
      .order("desc")
      .take(50);
  },
});
