import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function auditLog({
  ruleId,
  event,
  entityType,
  entityId,
  action,
  result,
  details,
}: {
  ruleId?:     string;
  event:       string;
  entityType?: string;
  entityId?:   string;
  action:      string;
  result:      "SUCCESS" | "FAILED" | "SKIPPED";
  details?:    Record<string, unknown>;
}) {
  try {
    await prisma.automationLog.create({
      data: { ruleId, event, entityType, entityId, action, result,
               details: details as Prisma.InputJsonValue | undefined },
    });
  } catch {
    // Never let audit failure break main flow
  }
}
