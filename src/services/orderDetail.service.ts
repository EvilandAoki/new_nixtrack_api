import { OrderDetailModel } from '../models/orderDetail.model';
import { OrderModel } from '../models/order.model';
import { CreateOrderDetailDto, UpdateOrderDetailDto, UserPayload, OrderDetail } from '../types';
import { UserModel } from '../models/user.model';

// Status IDs based on track_status table
const STATUS = {
  EN_TRANSITO: 2,
};

export class OrderDetailService {
  private static async verifyOrderAccess(orderId: number, currentUser?: UserPayload): Promise<void> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only access orders from their own client
    // EXCEPTION: Supervisors (2) & Operators (3) or users without client_id (internal staff)
    if (currentUser && !currentUser.is_admin && currentUser.client_id && ![2, 3, '2', '3'].includes(currentUser.role_id as any)) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }
  }

  private static async verifyOrderIsActive(orderId: number): Promise<void> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Can only add/edit details for orders in active status (En Tránsito = 2)
    if (order.status_id !== STATUS.EN_TRANSITO) {
      throw new Error('Can only add reports to orders in transit');
    }
  }

  private static validateCoordinates(latitude?: number, longitude?: number): void {
    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }
    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
    }
  }

  static async findByOrderId(orderId: number, currentUser?: UserPayload): Promise<OrderDetail[]> {
    await this.verifyOrderAccess(orderId, currentUser);
    return OrderDetailModel.findByOrderId(orderId);
  }

  static async findById(orderId: number | undefined, detailId: number, currentUser?: UserPayload): Promise<OrderDetail> {
    const detail = await OrderDetailModel.findById(detailId);
    if (!detail) {
      throw new Error('Order detail not found');
    }

    const actualOrderId = orderId || detail.shipment_id;

    if (orderId && detail.shipment_id !== orderId) {
      throw new Error('Order detail not found');
    }

    await this.verifyOrderAccess(actualOrderId, currentUser);

    return detail;
  }

  static async getWithFiles(orderId: number | undefined, detailId: number, currentUser?: UserPayload) {
    const detail = await this.findById(orderId, detailId, currentUser);
    const files = await OrderDetailModel.getFiles(detailId);
    return { ...detail, files };
  }

  static async create(orderId: number, data: CreateOrderDetailDto, currentUser?: UserPayload): Promise<OrderDetail> {
    await this.verifyOrderAccess(orderId, currentUser);
    await this.verifyOrderIsActive(orderId);

    // Validate coordinates
    this.validateCoordinates(data.latitude, data.longitude);

    // Get user name for reported_by
    let reportedBy = 'Sistema';
    if (currentUser?.id) {
      const user = await UserModel.findById(currentUser.id);
      if (user) {
        reportedBy = user.name;
      }
    }

    return OrderDetailModel.create(orderId, data, reportedBy, currentUser?.id);
  }

  static async update(orderId: number | undefined, detailId: number, data: UpdateOrderDetailDto, currentUser?: UserPayload): Promise<OrderDetail> {
    const detail = await OrderDetailModel.findById(detailId);
    if (!detail) {
      throw new Error('Order detail not found');
    }

    const actualOrderId = orderId || detail.shipment_id;

    if (orderId && detail.shipment_id !== orderId) {
      throw new Error('Order detail not found');
    }

    await this.verifyOrderAccess(actualOrderId, currentUser);
    await this.verifyOrderIsActive(actualOrderId);

    // Validate coordinates
    this.validateCoordinates(data.latitude, data.longitude);

    const updated = await OrderDetailModel.update(detailId, data, currentUser?.id);
    if (!updated) {
      throw new Error('Failed to update order detail');
    }
    return updated;
  }

  static async delete(orderId: number | undefined, detailId: number, currentUser?: UserPayload): Promise<boolean> {
    const detail = await OrderDetailModel.findById(detailId);
    if (!detail) {
      throw new Error('Order detail not found');
    }

    const actualOrderId = orderId || detail.shipment_id;

    if (orderId && detail.shipment_id !== orderId) {
      throw new Error('Order detail not found');
    }

    await this.verifyOrderAccess(actualOrderId, currentUser);
    await this.verifyOrderIsActive(actualOrderId);

    return OrderDetailModel.delete(detailId);
  }
}
