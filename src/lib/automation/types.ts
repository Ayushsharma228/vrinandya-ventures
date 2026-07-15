export type AutomationEventType =
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "SUPPLIER_ASSIGNED"
  | "SUPPLIER_ACCEPTED"
  | "SUPPLIER_REJECTED"
  | "SELLER_ONBOARDED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_APPROVED"
  | "NDR_CREATED"
  | "SETTLEMENT_GENERATED"
  | "INVENTORY_LOW";

export interface AutomationEvent {
  type:       AutomationEventType;
  entityId:   string;             // orderId, sellerId, withdrawalId, etc.
  entityType: string;             // ORDER, SELLER, WITHDRAWAL, etc.
  payload:    Record<string, unknown>;
  actorId?:   string;
}

export type ActionType =
  | "NOTIFY_SELLER"
  | "NOTIFY_SUPPLIER"
  | "NOTIFY_ADMIN"
  | "START_SLA_TIMER"
  | "UPDATE_SLA"
  | "LOG"
  | "CREATE_PURCHASE_ORDER";

export interface RuleAction {
  type:    ActionType;
  params?: Record<string, unknown>;
}

export interface RuleCondition {
  field:    string;
  operator: "eq" | "neq" | "gt" | "lt" | "in" | "exists";
  value:    unknown;
}
