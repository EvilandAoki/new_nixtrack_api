import { FileModel } from '../models/file.model';
import { VehicleModel } from '../models/vehicle.model';
import { OrderModel } from '../models/order.model';
import { OrderDetailModel } from '../models/orderDetail.model';
import { VehicleFile, OrderFile, OrderDetailFile, UserPayload } from '../types';

export class FileService {
  // Vehicle Files
  static async createVehicleFile(
    vehicleId: number,
    file: { filename: string; path: string; mimetype: string },
    description: string | undefined,
    isMainPhoto: boolean,
    currentUser?: UserPayload
  ): Promise<VehicleFile> {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Non-admin users can only upload files to their own client's vehicles
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (vehicle.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return FileModel.createVehicleFile({
      vehicle_id: vehicleId,
      file_name: file.filename,
      file_url: file.path,
      mime_type: file.mimetype,
      description,
      is_main_photo: isMainPhoto,
      created_by: currentUser?.id,
    });
  }

  static async deleteVehicleFile(vehicleId: number, fileId: number, currentUser?: UserPayload): Promise<boolean> {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Non-admin users can only delete files from their own client's vehicles
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (vehicle.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const file = await FileModel.findVehicleFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.vehicle_id !== vehicleId) {
      throw new Error('File not found');
    }

    return FileModel.deleteVehicleFile(fileId);
  }

  static async setMainVehiclePhoto(vehicleId: number, fileId: number, currentUser?: UserPayload): Promise<void> {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Non-admin users can only update files for their own client's vehicles
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (vehicle.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const file = await FileModel.findVehicleFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.vehicle_id !== vehicleId) {
      throw new Error('File not found');
    }

    return FileModel.setMainVehiclePhoto(vehicleId, fileId);
  }

  // Order Files
  static async createOrderFile(
    orderId: number,
    file: { filename: string; path: string; mimetype: string },
    description: string | undefined,
    currentUser?: UserPayload
  ): Promise<OrderFile> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only upload files to their own client's orders
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return FileModel.createOrderFile({
      shipment_id: orderId,
      file_name: file.filename,
      file_url: file.path,
      mime_type: file.mimetype,
      description,
      created_by: currentUser?.id,
    });
  }

  static async deleteOrderFile(orderId: number, fileId: number, currentUser?: UserPayload): Promise<boolean> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only delete files from their own client's orders
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const file = await FileModel.findOrderFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.shipment_id !== orderId) {
      throw new Error('File not found');
    }

    return FileModel.deleteOrderFile(fileId);
  }

  // Order Detail Files
  static async createOrderDetailFile(
    orderId: number,
    detailId: number,
    file: { filename: string; path: string; mimetype: string },
    description: string | undefined,
    currentUser?: UserPayload
  ): Promise<OrderDetailFile> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only upload files to their own client's orders
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const detail = await OrderDetailModel.findById(detailId);
    if (!detail) {
      throw new Error('Order detail not found');
    }

    if (detail.shipment_id !== orderId) {
      throw new Error('Order detail not found');
    }

    return FileModel.createOrderDetailFile({
      checkpoint_id: detailId,
      file_name: file.filename,
      file_url: file.path,
      mime_type: file.mimetype,
      description,
      created_by: currentUser?.id,
    });
  }

  static async deleteOrderDetailFile(
    orderId: number,
    detailId: number,
    fileId: number,
    currentUser?: UserPayload
  ): Promise<boolean> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Non-admin users can only delete files from their own client's orders
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (order.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const detail = await OrderDetailModel.findById(detailId);
    if (!detail) {
      throw new Error('Order detail not found');
    }

    if (detail.shipment_id !== orderId) {
      throw new Error('Order detail not found');
    }

    const file = await FileModel.findOrderDetailFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.checkpoint_id !== detailId) {
      throw new Error('File not found');
    }

    return FileModel.deleteOrderDetailFile(fileId);
  }
}
