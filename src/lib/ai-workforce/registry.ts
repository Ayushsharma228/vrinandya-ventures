import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { EmployeeDefinition, EmployeeSlug } from "./types";
import { arya } from "./employees/arya";
import { lena } from "./employees/lena";
import { priya } from "./employees/priya";
import { vikram } from "./employees/vikram";
import { meera } from "./employees/meera";

export const EMPLOYEE_DEFINITIONS: Record<EmployeeSlug, EmployeeDefinition> = {
  arya,
  lena,
  priya,
  vikram,
  meera,
};

let seeded = false;

export async function ensureEmployees(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const defs = Object.values(EMPLOYEE_DEFINITIONS);
  for (const def of defs) {
    await prisma.aIEmployee.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        name: def.name,
        role: def.role,
        description: def.description,
        avatar: def.avatar,
        permissions: def.permissions as unknown as Prisma.InputJsonValue,
        tools: def.tools,
        isActive: true,
      },
      update: {
        name: def.name,
        role: def.role,
        description: def.description,
        avatar: def.avatar,
        permissions: def.permissions as unknown as Prisma.InputJsonValue,
        tools: def.tools,
      },
    });
  }

  // Seed AI tools catalogue
  const toolDefs = [
    // Sales
    { name: "read_crm_leads",       description: "List CRM leads with filters",            module: "sales"      },
    { name: "read_crm_lead_detail", description: "Get a single lead with activity history", module: "sales"      },
    { name: "create_crm_note",      description: "Attach a note to a lead",                 module: "sales"      },
    { name: "update_lead_stage",    description: "Move a lead to a different pipeline stage", module: "sales"    },
    { name: "read_sellers",         description: "List seller accounts",                    module: "sales"      },
    // Listing
    { name: "read_product",         description: "Get product details",                     module: "listing"    },
    { name: "read_listing_content", description: "Get listing content for a product",        module: "listing"   },
    { name: "validate_listing",     description: "Run validation against a marketplace",     module: "listing"   },
    { name: "generate_listing_content", description: "AI-generate listing content draft",    module: "listing"  },
    { name: "update_listing_content",   description: "Save listing content updates",         module: "listing"  },
    { name: "read_listing_analytics",   description: "Get listing analytics metrics",        module: "listing"  },
    // Finance
    { name: "read_wallet",          description: "Read seller/supplier wallet balance",      module: "finance"   },
    { name: "read_settlement",      description: "Read settlement records",                  module: "finance"   },
    { name: "read_ledger",          description: "Read wallet transaction ledger",           module: "finance"   },
    { name: "read_reconciliation",  description: "Read reconciliation reports",              module: "finance"   },
    { name: "generate_finance_report", description: "Generate a finance summary report",    module: "finance"   },
    { name: "read_withdrawal_requests", description: "Read pending withdrawal requests",    module: "finance"   },
    // Operations
    { name: "read_orders",          description: "List orders with filters",                 module: "operations" },
    { name: "read_order_detail",    description: "Get full order details",                   module: "operations" },
    { name: "assign_supplier",      description: "Assign a supplier to an order",            module: "operations" },
    { name: "update_order_status",  description: "Update order status",                      module: "operations" },
    { name: "track_shipment",       description: "Get shipment tracking info",               module: "operations" },
    { name: "read_sla_status",      description: "Check SLA compliance for orders",          module: "operations" },
    { name: "read_ndr_list",        description: "List NDR (non-delivery report) cases",     module: "operations" },
    { name: "read_inventory",       description: "Check inventory levels",                   module: "operations" },
    // Support
    { name: "read_notifications",   description: "Read system notifications",                module: "support"   },
    { name: "create_notification",  description: "Send a notification to a user",            module: "support"   },
    { name: "read_seller_profile",  description: "Get seller profile details",               module: "support"   },
    { name: "read_supplier_profile", description: "Get supplier profile details",            module: "support"   },
    { name: "create_support_note",  description: "Log a support note",                       module: "support"   },
  ];

  for (const t of toolDefs) {
    await prisma.aITool.upsert({
      where:  { name: t.name },
      create: t,
      update: { description: t.description, module: t.module },
    });
  }
}

export async function getEmployeeBySlug(slug: string) {
  return prisma.aIEmployee.findUnique({ where: { slug } });
}

export function getDefinition(slug: EmployeeSlug): EmployeeDefinition {
  return EMPLOYEE_DEFINITIONS[slug];
}
