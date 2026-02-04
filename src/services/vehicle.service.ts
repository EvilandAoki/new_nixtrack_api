import { VehicleModel, VehicleFilters } from '../models/vehicle.model';
import { CreateVehicleDto, UpdateVehicleDto, UserPayload, Vehicle, VehicleWithClient } from '../types';

export class VehicleService {
  static async findAll(filters: VehicleFilters, currentUser?: UserPayload) {
    // Non-admin users can only see vehicles from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      filters.client_id = currentUser.client_id;
    }
    return VehicleModel.findAll(filters);
  }

  static async findById(id: number, currentUser?: UserPayload): Promise<VehicleWithClient> {
    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Non-admin users can only see vehicles from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (vehicle.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return vehicle;
  }

  static async getWithFiles(id: number, currentUser?: UserPayload) {
    const vehicle = await this.findById(id, currentUser);
    const files = await VehicleModel.getFiles(id);
    return { ...vehicle, files };
  }

  static async getOrderHistory(id: number, currentUser?: UserPayload) {
    // Verify access first
    await this.findById(id, currentUser);
    return VehicleModel.getOrderHistory(id);
  }

  static async create(data: CreateVehicleDto, currentUser?: UserPayload): Promise<Vehicle> {
    // Non-admin users can only create vehicles for their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (data.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    // Validate license_plate uniqueness
    const existingVehicle = await VehicleModel.findByLicensePlate(data.license_plate);
    if (existingVehicle) {
      throw new Error('License plate already registered');
    }

    return VehicleModel.create(data, currentUser?.id);
  }

  static async update(id: number, data: UpdateVehicleDto, currentUser?: UserPayload): Promise<Vehicle> {
    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Non-admin users can only update vehicles from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (vehicle.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    const updated = await VehicleModel.update(id, data, currentUser?.id);
    if (!updated) {
      throw new Error('Failed to update vehicle');
    }
    return updated;
  }

  static async delete(id: number, currentUser?: UserPayload): Promise<boolean> {
    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Non-admin users can only delete vehicles from their own client
    if (currentUser && !currentUser.is_admin && currentUser.client_id) {
      if (vehicle.client_id !== currentUser.client_id) {
        throw new Error('Access denied');
      }
    }

    return VehicleModel.delete(id, currentUser?.id);
  }
}
