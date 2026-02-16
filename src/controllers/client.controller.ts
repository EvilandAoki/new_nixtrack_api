import { Response } from 'express';
import { ClientService } from '../services/client.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export class ClientController {
  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, is_active, page, limit } = req.query;

      const filters = {
        search: search as string | undefined,
        is_active: is_active !== undefined
          ? (String(is_active) === 'true' || String(is_active) === '1')
          : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      };

      const result = await ClientService.findAll(filters, req.user);

      sendPaginated(res, result.data, result.total, filters.page, filters.limit);
    } catch (error) {
      sendError(res, 'Failed to get clients', 500);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const client = await ClientService.findById(id, req.user);
      sendSuccess(res, client);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get client';
      const statusCode =
        message === 'Client not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Only admin can create clients
      // Admin and Operator can create clients
      const isAllowed = req.user?.is_admin || [3, '3'].includes(req.user?.role_id as any);
      if (!isAllowed) {
        sendError(res, 'Access denied', 403);
        return;
      }

      const client = await ClientService.create(req.body, req.user?.id);
      sendSuccess(res, client, 'Client created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create client';
      const statusCode = message === 'Tax ID already registered' ? 409 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Only admin can update clients
      // Admin and Operator can update clients
      const isAllowed = req.user?.is_admin || [3, '3'].includes(req.user?.role_id as any);
      if (!isAllowed) {
        sendError(res, 'Access denied', 403);
        return;
      }

      const id = parseInt(req.params.id, 10);
      const client = await ClientService.update(id, req.body, req.user?.id);
      sendSuccess(res, client, 'Client updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update client';
      const statusCode =
        message === 'Client not found' ? 404 :
          message === 'Tax ID already in use' ? 409 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Only admin can delete clients
      // Admin and Operator can delete clients
      const isAllowed = req.user?.is_admin || [3, '3'].includes(req.user?.role_id as any);
      if (!isAllowed) {
        sendError(res, 'Access denied', 403);
        return;
      }

      const id = parseInt(req.params.id, 10);
      await ClientService.delete(id, req.user?.id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete client';
      const statusCode = message === 'Client not found' ? 404 : 500;
      sendError(res, message, statusCode);
    }
  }
}
