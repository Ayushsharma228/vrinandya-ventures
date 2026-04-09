export const ORDER_STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600",
  PROCESSING: "bg-yellow-50 text-yellow-600",
  SHIPPED: "bg-indigo-50 text-indigo-600",
  IN_TRANSIT: "bg-purple-50 text-purple-600",
  DELIVERED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};
