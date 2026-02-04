import { Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export class VehicleController {
  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { client_id, is_escort_vehicle, search, is_active, page, limit } = req.query;

      const filters = {
        client_id: client_id ? parseInt(client_id as string, 10) : undefined,
        is_escort_vehicle: is_escort_vehicle !== undefined
          ? (String(is_escort_vehicle) === 'true' || String(is_escort_vehicle) === '1')
          : undefined,
        search: search as string | undefined,
        is_active: is_active !== undefined
          ? (String(is_active) === 'true' || String(is_active) === '1')
          : true,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
      };

      const result = await VehicleService.findAll(filters, req.user);

      sendPaginated(res, result.data, result.total, filters.page, filters.limit);
    } catch (error) {
      sendError(res, 'Failed to get vehicles', 500);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const vehicle = await VehicleService.getWithFiles(id, req.user);
      sendSuccess(res, vehicle);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get vehicle';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const history = await VehicleService.getOrderHistory(id, req.user);
      sendSuccess(res, history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get vehicle history';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const vehicle = await VehicleService.create(req.body, req.user);
      sendSuccess(res, vehicle, 'Vehicle created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create vehicle';
      const statusCode =
        message === 'License plate already registered' ? 409 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const vehicle = await VehicleService.update(id, req.body, req.user);
      sendSuccess(res, vehicle);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update vehicle';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await VehicleService.delete(id, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete vehicle';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }
}
