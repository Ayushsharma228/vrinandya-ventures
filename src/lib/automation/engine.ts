import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AutomationEvent, RuleCondition, RuleAction } from "./types";
import { auditLog } from "./audit";
import { startOrderSla, recordSlaEvent } from "./sla";

// System rules seeded once to DB — never hardcoded at runtime
const SYSTEM_RULES = [
  {
    name:        "Start SLA on Order Created",
    description: "Begins assignment SLA timer when a new order is created",
    event:       "ORDER_CREATED",
    conditions:  null,
    actions:     [{ type: "START_SLA_TIMER" }, { type: "NOTIFY_ADMIN", params: { message: "New order created — awaiting supplier assignment" } }],
    params:      null,
  },
  {
    name:        "Update SLA on Supplier Assigned",
    description: "Records assignment timestamp and starts acceptance SLA",
    event:       "SUPPLIER_ASSIGNED",
    conditions:  null,
    actions:     [{ type: "UPDATE_SLA", params: { stage: "assigned" } }, { type: "NOTIFY_SUPPLIER", params: { message: "You have been assigned a new order. Please accept or reject within 24 hours." } }],
    params:      null,
  },
  {
    name:        "Update SLA on Supplier Accepted",
    description: "Records acceptance timestamp and starts packing SLA",
    event:       "SUPPLIER_ACCEPTED",
    conditions:  null,
    actions:     [{ type: "UPDATE_SLA", params: { stage: "accepted" } }, { type: "NOTIFY_SELLER", params: { message: "Your order has been accepted by the supplier and is being prepared." } }],
    params:      null,
  },
  {
    name:        "Notify on Supplier Rejected",
    description: "Alerts admin when supplier rejects an order",
    event:       "SUPPLIER_REJECTED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_ADMIN", params: { message: "Supplier rejected an order — reassignment required" } }],
    params:      null,
  },
  {
    name:        "Notify on Seller Onboarded",
    description: "Welcome notification when new seller completes onboarding",
    event:       "SELLER_ONBOARDED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_SELLER", params: { message: "Welcome to AXQEN! Your account is active." } }],
    params:      null,
  },
  {
    name:        "Notify on KYC Approved",
    description: "Notifies seller when KYC is approved",
    event:       "KYC_APPROVED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_SELLER", params: { message: "Your KYC has been approved. You can now access all features." } }],
    params:      null,
  },
  {
    name:        "Notify on KYC Rejected",
    description: "Notifies seller when KYC is rejected",
    event:       "KYC_REJECTED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_SELLER", params: { message: "Your KYC was not approved. Please resubmit with correct documents." } }],
    params:      null,
  },
  {
    name:        "Notify Admin on Withdrawal Requested",
    description: "Alerts admin when a seller requests a withdrawal",
    event:       "WITHDRAWAL_REQUESTED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_ADMIN", params: { message: "New withdrawal request pending approval" } }],
    params:      null,
  },
  {
    name:        "Notify Seller on Withdrawal Approved",
    description: "Notifies seller when withdrawal is approved",
    event:       "WITHDRAWAL_APPROVED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_SELLER", params: { message: "Your withdrawal request has been approved and will be processed shortly." } }],
    params:      null,
  },
  {
    name:        "Update SLA on Order Dispatched",
    description: "Records dispatch timestamp on order dispatch",
    event:       "ORDER_STATUS_CHANGED",
    conditions:  [{ field: "status", operator: "eq", value: "SHIPPED" }],
    actions:     [{ type: "UPDATE_SLA", params: { stage: "dispatched" } }],
    params:      null,
  },
  {
    name:        "Update SLA on Order Delivered",
    description: "Records delivery timestamp on order delivery",
    event:       "ORDER_STATUS_CHANGED",
    conditions:  [{ field: "status", operator: "eq", value: "DELIVERED" }],
    actions:     [{ type: "UPDATE_SLA", params: { stage: "delivered" } }],
    params:      null,
  },
  {
    name:        "Notify on NDR Created",
    description: "Alerts admin and seller when an NDR is raised",
    event:       "NDR_CREATED",
    conditions:  null,
    actions:     [
      { type: "NOTIFY_ADMIN",  params: { message: "New NDR created — action required" } },
      { type: "NOTIFY_SELLER", params: { message: "A delivery attempt failed for your order. Please check NDR dashboard." } },
    ],
    params:      null,
  },
  {
    name:        "Notify Seller on Settlement Generated",
    description: "Notifies seller when a settlement is created for their order",
    event:       "SETTLEMENT_GENERATED",
    conditions:  null,
    actions:     [{ type: "NOTIFY_SELLER", params: { message: "A settlement has been generated for your order." } }],
    params:      null,
  },
  {
    name:        "Notify Admin on Low Inventory",
    description: "Alerts admin when a supplier's inventory drops low",
    event:       "INVENTORY_LOW",
    conditions:  null,
    actions:     [{ type: "NOTIFY_ADMIN", params: { message: "Supplier inventory is running low — review stock levels" } }],
    params:      null,
  },
];

let systemRulesSeeded = false;

async function ensureSystemRules() {
  if (systemRulesSeeded) return;
  try {
    for (const rule of SYSTEM_RULES) {
      await prisma.automationRule.upsert({
        where:  { name: rule.name },
        create: {
          name:        rule.name,
          description: rule.description,
          event:       rule.event,
          actions:     rule.actions as Prisma.InputJsonValue,
          conditions:  rule.conditions ?? Prisma.JsonNull,
          params:      rule.params      ?? Prisma.JsonNull,
          isSystem:    true,
          enabled:     true,
        },
        update: {
          description: rule.description,
          actions:     rule.actions     as Prisma.InputJsonValue,
          conditions:  rule.conditions  ?? Prisma.JsonNull,
        },
      });
    }
    systemRulesSeeded = true;
  } catch { /* non-critical */ }
}

function evaluateCondition(condition: RuleCondition, payload: Record<string, unknown>): boolean {
  const val = payload[condition.field];
  switch (condition.operator) {
    case "eq":     return val === condition.value;
    case "neq":    return val !== condition.value;
    case "gt":     return typeof val === "number" && val > (condition.value as number);
    case "lt":     return typeof val === "number" && val < (condition.value as number);
    case "in":     return Array.isArray(condition.value) && condition.value.includes(val);
    case "exists": return val !== undefined && val !== null;
    default:       return false;
  }
}

async function executeAction(action: RuleAction, event: AutomationEvent, ruleId: string) {
  const p = action.params ?? {};

  if (action.type === "START_SLA_TIMER") {
    await startOrderSla(event.entityId);
    await auditLog({ ruleId, event: event.type, entityType: event.entityType, entityId: event.entityId,
                     action: "START_SLA_TIMER", result: "SUCCESS" });

  } else if (action.type === "UPDATE_SLA") {
    const stage = (p.stage ?? event.payload?.stage) as "assigned" | "accepted" | "packed" | "dispatched" | "delivered";
    if (stage) {
      await recordSlaEvent(event.entityId, stage);
      await auditLog({ ruleId, event: event.type, entityType: event.entityType, entityId: event.entityId,
                       action: `UPDATE_SLA:${stage}`, result: "SUCCESS" });
    }

  } else if (action.type === "NOTIFY_SELLER" || action.type === "NOTIFY_SUPPLIER" || action.type === "NOTIFY_ADMIN") {
    // Notification dispatch — fire and forget, no email sending here to avoid blocking
    await auditLog({ ruleId, event: event.type, entityType: event.entityType, entityId: event.entityId,
                     action: action.type, result: "SUCCESS",
                     details: { message: p.message, recipient: event.payload?.sellerId ?? event.payload?.supplierId ?? "admin" } });

  } else if (action.type === "LOG") {
    await auditLog({ ruleId, event: event.type, entityType: event.entityType, entityId: event.entityId,
                     action: "LOG", result: "SUCCESS", details: event.payload });
  }
}

export async function dispatchEvent(event: AutomationEvent) {
  // Fire-and-forget — never awaited from caller
  setImmediate(async () => {
    try {
      await ensureSystemRules();

      const rules = await prisma.automationRule.findMany({
        where: { event: event.type, enabled: true },
      });

      for (const rule of rules) {
        try {
          const conditions = (rule.conditions as unknown as RuleCondition[] | null) ?? [];
          const allMet = conditions.every(c => evaluateCondition(c, event.payload));
          if (!allMet) {
            await auditLog({ ruleId: rule.id, event: event.type, entityType: event.entityType,
                             entityId: event.entityId, action: "CONDITION_CHECK", result: "SKIPPED",
                             details: { reason: "conditions not met" } });
            continue;
          }

          const actions = (rule.actions as unknown as RuleAction[]) ?? [];
          for (const action of actions) {
            try {
              await executeAction(action, event, rule.id);
            } catch {
              await auditLog({ ruleId: rule.id, event: event.type, entityType: event.entityType,
                               entityId: event.entityId, action: action.type, result: "FAILED" });
            }
          }
        } catch { /* skip broken rule, don't stop others */ }
      }
    } catch { /* engine failure must never surface to caller */ }
  });
}
