export type EmployeeSlug = "arya" | "lena" | "priya" | "vikram" | "meera";

export interface PermissionSet {
  canRead: string[];
  canWrite: string[];
  cannotAccess: string[];
}

export interface EmployeeDefinition {
  slug: EmployeeSlug;
  name: string;
  role: string;
  description: string;
  avatar: string; // emoji
  permissions: PermissionSet;
  tools: string[];
  instructions: string;
}

export interface ToolContext {
  employeeId: string;
  taskId?: string;
  userId?: string;
}

export type ToolHandler = (input: unknown, context: ToolContext) => Promise<unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  module: string;
  handler: ToolHandler;
}

export interface TaskInput {
  employeeSlug: EmployeeSlug;
  type: string;
  title: string;
  description?: string;
  input?: unknown;
  priority?: number;
  source?: string;
  sourceId?: string;
  scheduledAt?: Date;
}

export interface MemoryEntry {
  type: string;
  key: string;
  value: unknown;
  expiresAt?: Date;
}

export interface ConsoleStats {
  employees: EmployeeRow[];
  tasksByStatus: Record<string, number>;
  activitiesToday: number;
  failedTasksToday: number;
  completedTasksToday: number;
  successRate: number;
  avgDuration: number | null;
}

export interface EmployeeRow {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string | null;
  avatar: string | null;
  status: string;
  isActive: boolean;
  pendingTasks: number;
  processingTasks: number;
  completedToday: number;
  failedToday: number;
}
