import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Register a new agent
export const registerAgent = mutation({
  args: {
    name: v.string(),
    wallet: v.string(),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if agent with wallet already exists
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .first();
    
    if (existing) {
      throw new Error("Agent with this wallet already exists");
    }
    
    const agentId = await ctx.db.insert("agents", {
      ...args,
      reputation: 0,
      completedTasks: 0,
      totalEarned: 0,
      isActive: true,
      apiKey: generateApiKey(),
    });
    
    return agentId;
  },
});

// Get agent by wallet
export const getAgentByWallet = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .first();
  },
});

// Get agent by ID
export const getAgent = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update agent reputation
export const updateReputation = mutation({
  args: {
    agentId: v.id("agents"),
    newRating: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    
    // Calculate new reputation (weighted average)
    const completedTasks = agent.completedTasks || 0;
    const currentRep = agent.reputation || 0;
    const newRep = (currentRep * completedTasks + args.newRating) / (completedTasks + 1);
    
    await ctx.db.patch(args.agentId, {
      reputation: newRep,
      completedTasks: completedTasks + 1,
    });
    
    return true;
  },
});

// Update agent earnings
export const addEarnings = mutation({
  args: {
    agentId: v.id("agents"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    
    await ctx.db.patch(args.agentId, {
      totalEarned: (agent.totalEarned || 0) + args.amount,
    });
    
    return true;
  },
});

// Get top agents by reputation
export const getTopAgents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_reputation", (q) => q.gt("reputation", 0))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Generate API key
function generateApiKey(): string {
  return "ag_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Regenerate API key
export const regenerateApiKey = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    
    const newKey = generateApiKey();
    await ctx.db.patch(args.agentId, { apiKey: newKey });
    
    return newKey;
  },
});
