import { OrderStatus } from '../../../common/enums';

// Order workflow state machine
export class WorkflowService {
  // Valid state transitions
  private readonly transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.WASHING, OrderStatus.CANCELLED],
    [OrderStatus.WASHING]: [OrderStatus.PACKING],
    [OrderStatus.PACKING]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  canTransition(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
    return this.transitions[fromStatus]?.includes(toStatus) ?? false;
  }

  async transitionOrder(orderId: string, toStatus: OrderStatus): Promise<any> {
    // TODO: Implement state transition with audit trail
    return {
      orderId,
      newStatus: toStatus,
      transitionedAt: new Date(),
    };
  }

  async getWorkflowHistory(orderId: string): Promise<any[]> {
    // TODO: Fetch workflow history from database
    return [];
  }
}
