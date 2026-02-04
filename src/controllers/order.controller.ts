import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export class OrderController {
  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { client_id, vehicle_id, status_id, from_date, to_date, search, page, limit } = req.query;

      const filters = {
        client_id: client_id ? parseInt(client_id as string, 10) : undefined,
        vehicle_id: vehicle_id ? parseInt(vehicle_id as string, 10) : undefined,
        status_id: status_id ? parseInt(status_id as string, 10) : undefined,
        from_date: from_date as string | undefined,
        to_date: to_date as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      };

      const result = await OrderService.findAll(filters, req.user);

      sendPaginated(res, result.data, result.total, filters.page, filters.limit);
    } catch (error) {
      sendError(res, 'Failed to get orders', 500);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await OrderService.getWithDetails(id, req.user);
      sendSuccess(res, order);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get order';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const order = await OrderService.create(req.body, req.user);
      sendSuccess(res, order, 'Order created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      const statusCode =
        message === 'Order number already exists' ? 409 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await OrderService.update(id, req.body, req.user);
      sendSuccess(res, order, 'Order updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 :
            message === 'Cannot modify finalized or cancelled orders' ? 400 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { status_id } = req.body;

      if (!status_id || typeof status_id !== 'number') {
        sendError(res, 'status_id is required and must be a number', 400);
        return;
      }

      const order = await OrderService.updateStatus(id, status_id, req.user);
      sendSuccess(res, order, 'Order status updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order status';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 :
            message === 'Invalid status transition' ? 400 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await OrderService.delete(id, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete order';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async activate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await OrderService.updateStatus(id, 2, req.user); // 2 = EN_TRANSITO
      sendSuccess(res, order, 'Order activated successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to activate order', 500);
    }
  }

  static async finalize(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { arrival_at } = req.body;
      const order = await OrderService.update(id, { status_id: 4, arrival_at } as any, req.user); // 4 = ENTREGADO
      sendSuccess(res, order, 'Order finalized successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to finalize order', 500);
    }
  }

  static async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await OrderService.updateStatus(id, 5, req.user); // 5 = CANCELADO
      sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to cancel order', 500);
    }
  }

  static async checkOrderNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const { exclude_id } = req.query;
      const order = await OrderService.findByOrderNumber(orderNumber);

      const exists = order ? order.id !== parseInt(exclude_id as string, 10) : false;
      sendSuccess(res, { exists });
    } catch (error) {
      sendError(res, 'Failed to check order number', 500);
    }
  }
}
