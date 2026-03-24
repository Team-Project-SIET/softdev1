export enum OrderStatus {
  PENDING = 'PENDING',
  WASHING = 'WASHING',
  PACKING = 'PACKING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.WASHING]: 'Washing',
  [OrderStatus.PACKING]: 'Packing',
  [OrderStatus.READY]: 'Ready for Pickup',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.CANCELLED]: 'Cancelled',
};
