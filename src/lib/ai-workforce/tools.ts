import { prisma } from "@/lib/prisma";
import type { ToolDefinition, ToolContext } from "./types";
import { assertPermission } from "./permissions";
import type { EmployeeSlug } from "./types";

const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(def: ToolDefinition): void {
  toolRegistry.set(def.name, def);
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

export function listRegisteredTools(): ToolDefinition[] {
  return Array.from(toolRegistry.values());
}

export async function executeTool(
  slug: EmployeeSlug,
  employeeId: string,
  toolName: string,
  input: unknown,
  context: Omit<ToolContext, "employeeId">,
): Promise<unknown> {
  assertPermission(slug, toolName);

  const tool = toolRegistry.get(toolName);
  if (!tool) throw new Error(`Tool "${toolName}" is not registered`);

  const start = Date.now();
  let result: unknown = null;
  let error: string | undefined;

  try {
    result = await tool.handler(input, { ...context, employeeId });
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - start;
    prisma.aIActivity.create({
      data: {
        employeeId,
        taskId:    context.taskId ?? null,
        toolName,
        action:    `Used tool: ${toolName}`,
        result:    result as never,
        error:     error ?? null,
        duration,
        userId:    context.userId ?? null,
      },
    }).catch(() => {});
  }

  return result;
}

// ── Built-in stub implementations ─────────────────────────────────────────────
// These handlers read real data but make no mutations.
// LLM integration replaces the "generate_*" stubs.

registerTool({
  name: "read_orders",
  description: "List orders with filters",
  module: "operations",
  handler: async (input) => {
    const { status, limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.order.findMany({
      where: status ? { status: status as never } : {},
      take: limit as number,
      orderBy: { createdAt: "desc" },
      select: { id: true, externalOrderId: true, status: true, createdAt: true },
    });
  },
});

registerTool({
  name: "read_order_detail",
  description: "Get full order details",
  module: "operations",
  handler: async (input) => {
    const { orderId } = (input as Record<string, string>) ?? {};
    return prisma.order.findUnique({ where: { id: orderId } });
  },
});

registerTool({
  name: "read_crm_leads",
  description: "List CRM leads with filters",
  module: "sales",
  handler: async (input) => {
    const { stage, limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.lead.findMany({
      where: stage ? { stage: stage as never } : {},
      take: limit as number,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, phone: true, stage: true, pipelineStage: true, createdAt: true },
    });
  },
});

registerTool({
  name: "read_sellers",
  description: "List seller accounts",
  module: "sales",
  handler: async (input) => {
    const { limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.user.findMany({
      where: { role: "SELLER" },
      take: limit as number,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, accountStatus: true, kycStatus: true, createdAt: true },
    });
  },
});

registerTool({
  name: "read_product",
  description: "Get product details",
  module: "listing",
  handler: async (input) => {
    const { productId } = (input as Record<string, string>) ?? {};
    return prisma.product.findUnique({ where: { id: productId } });
  },
});

registerTool({
  name: "read_listing_content",
  description: "Get listing content for a product",
  module: "listing",
  handler: async (input) => {
    const { productId } = (input as Record<string, string>) ?? {};
    return prisma.listingContent.findUnique({ where: { productId } });
  },
});

registerTool({
  name: "validate_listing",
  description: "Run validation against a marketplace",
  module: "listing",
  handler: async (input) => {
    const { productId, platform } = (input as Record<string, string>) ?? {};
    const { validateListing } = await import("@/lib/listing/validation");
    return validateListing({ productId, platform: platform as never });
  },
});

registerTool({
  name: "generate_listing_content",
  description: "AI-generate listing content draft (stub — returns empty until LLM is wired)",
  module: "listing",
  handler: async (input) => {
    const { productId } = (input as Record<string, string>) ?? {};
    const content = await prisma.listingContent.findUnique({ where: { productId } });
    return { stub: true, existingContent: content, message: "AI generation not yet wired" };
  },
});

registerTool({
  name: "read_wallet",
  description: "Read seller wallet transactions and balance",
  module: "finance",
  handler: async (input) => {
    const { sellerId, limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.walletTransaction.findMany({
      where: sellerId ? { sellerId: sellerId as string } : {},
      take: limit as number,
      orderBy: { createdAt: "desc" },
    });
  },
});

registerTool({
  name: "read_settlement",
  description: "Read settlement records",
  module: "finance",
  handler: async (input) => {
    const { sellerId, limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.settlement.findMany({
      where: sellerId ? { sellerId: sellerId as string } : {},
      take: limit as number,
      orderBy: { createdAt: "desc" },
    });
  },
});

registerTool({
  name: "read_notifications",
  description: "Read system notifications",
  module: "support",
  handler: async (input) => {
    const { userId, limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.notification.findMany({
      where: userId ? { userId: userId as string } : {},
      take: limit as number,
      orderBy: { createdAt: "desc" },
    });
  },
});

registerTool({
  name: "read_seller_profile",
  description: "Get seller profile details",
  module: "support",
  handler: async (input) => {
    const { sellerId } = (input as Record<string, string>) ?? {};
    return prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, email: true, phone: true, accountStatus: true, kycStatus: true, brandName: true },
    });
  },
});

registerTool({
  name: "create_notification",
  description: "Send a notification to a user",
  module: "support",
  handler: async (input) => {
    const { userId, title, message, type = "GENERAL" } = (input as Record<string, string>) ?? {};
    return prisma.notification.create({
      data: { userId, title, message, type: type as never },
    });
  },
});

registerTool({
  name: "read_inventory",
  description: "Check inventory levels",
  module: "operations",
  handler: async (input) => {
    const { supplierId, limit = 20 } = (input as Record<string, unknown>) ?? {};
    return prisma.inventoryItem.findMany({
      where: supplierId ? { supplierId: supplierId as string } : {},
      take: limit as number,
      orderBy: { availableQty: "asc" },
    });
  },
});
