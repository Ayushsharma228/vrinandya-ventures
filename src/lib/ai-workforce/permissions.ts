import { EMPLOYEE_DEFINITIONS } from "./registry";
import type { EmployeeSlug, PermissionSet } from "./types";

export function getPermissions(slug: EmployeeSlug): PermissionSet {
  return EMPLOYEE_DEFINITIONS[slug].permissions;
}

export function canRead(slug: EmployeeSlug, module: string): boolean {
  const { canRead, cannotAccess } = getPermissions(slug);
  if (cannotAccess.some((b) => module.startsWith(b) || b.startsWith(module))) return false;
  return canRead.some((r) => module.startsWith(r) || r.startsWith(module) || r === "*");
}

export function canWrite(slug: EmployeeSlug, module: string): boolean {
  const { canWrite: cw, cannotAccess } = getPermissions(slug);
  if (cannotAccess.some((b) => module.startsWith(b) || b.startsWith(module))) return false;
  return cw.some((r) => module.startsWith(r) || r.startsWith(module) || r === "*");
}

export function canUseTool(slug: EmployeeSlug, toolName: string): boolean {
  const def = EMPLOYEE_DEFINITIONS[slug];
  return def.tools.includes(toolName);
}

export function assertPermission(slug: EmployeeSlug, toolName: string): void {
  if (!canUseTool(slug, toolName)) {
    throw new Error(`AI employee "${slug}" does not have permission to use tool "${toolName}"`);
  }
}
