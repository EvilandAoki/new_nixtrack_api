import { OrderModel, OrderFilters } from '../models/order.model';
import { OrderDetailModel } from '../models/orderDetail.model';
import { CreateOrderDto, UpdateOrderDto, UserPayload, Order, OrderWithDetails } from '../types';

// Status IDs based on track_status table
const STATUS = {
  PENDIENTE: 1,
  EN_TRANSITO: 2,
  EN_PUNTO_CONTROL: 3,
  ENTREGADO: 4,
  CANCELADO: 5,
  RETRASADO: 6,
  INCIDENTE: 7,
};

// Valid status transitions
const VALID_TRANSITIONS: Record<number, number[]> = {
  [STATUS.PENDIENTE]: [STATUS.EN_TRANSITO, STATUS.CANCELADO],
  [STATUS.EN_TRANSITO]: [STATUS.EN_PUNTO_CONTROL, STATUS.ENTREGADO, STATUS.CANCELADO, STATUS.RETRASADO, STATUS.INCIDENTE],
  [STATUS.EN_PUNTO_CONTROL]: [STATUS.EN_TRANSITO, STATUS.ENTREGADO, STATUS.CANCELADO, STATUS.RETRASADO, STATUS.INCIDENTE],
  [STATUS.RETRASADO]: [STATUS.EN_TRANSITO, STATUS.EN_PUNTO_CONTROL, STATUS.ENTREGADO, STATUS.CANCELADO, STATUS.INCIDENTE],
  [STATUS.INCIDENTE]: [STATUS.EN_TRANSITO, STATUS.EN_PUNTO_CONTROL, STATUS.ENTREGADO, STATUS.CANCELADO],
  // Final states - no transitions allowed
  [STATUS.ENTREGADO]: [],
  [STATUS.CANCELADO]: [],
};

export class OrderService {
  static async findAll(filters: OrderFilters, currentUser?: UserPayload) {
    // Non-admin users can only see orders from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      filters.client_id = currentUser.client_id;
    }
    return OrderModel.findAll(filters);
  }

  static async findById(id: number, currentUser?: UserPayload): Promise<OrderWithDetails> {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only see orders from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return order;
  }

  static async getWithDetails(id: number, currentUser?: UserPayload) {
    const order = await this.findById(id, currentUser);
    const details = await OrderDetailModel.findByOrderId(id);
    const files = await OrderModel.getFiles(id);
    return { ...order, details, files };
  }

  static async create(data: CreateOrderDto, currentUser?: UserPayload): Promise<Order> {
    // Non-admin users can only create orders for their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (data.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    // Validate order_number uniqueness
    const existingOrder = await OrderModel.findByOrderNumber(data.order_number);
    if (existingOrder) {
      throw new Error('Order number already exists');
    }

    // Validate departure_at < arrival_at if both provided
    // (arrival_at is not provided at creation, only set when finalizing)

    return OrderModel.create(data, currentUser?.id);
  }

  static async update(id: number, data: UpdateOrderDto, currentUser?: UserPayload): Promise<Order> {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only update orders from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    // Cannot modify finalized or cancelled orders
    if (order.status_id === STATUS.ENTREGADO || order.status_id === STATUS.CANCELADO) {
      throw new Error('Cannot modify finalized or cancelled orders');
    }

    const updated = await OrderModel.update(id, data, currentUser?.id);
    if (!updated) {
      throw new Error('Failed to update order');
    }
    return updated;
  }

  static async updateStatus(id: number, newStatusId: number, currentUser?: UserPayload): Promise<Order> {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only update orders from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const currentStatus = order.status_id || STATUS.PENDIENTE;

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatusId)) {
      throw new Error('Invalid status transition');
    }

    const updated = await OrderModel.updateStatus(id, newStatusId, currentUser?.id);
    if (!updated) {
      throw new Error('Failed to update order status');
    }
    return updated;
  }

  static async delete(id: number, currentUser?: UserPayload): Promise<boolean> {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only delete orders from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return OrderModel.delete(id, currentUser?.id);
  }

  static async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return OrderModel.findByOrderNumber(orderNumber);
  }
}
