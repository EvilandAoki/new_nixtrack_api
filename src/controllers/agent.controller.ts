import { Response } from 'express';
import { AgentService } from '../services/agent.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export class AgentController {
  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vehicle_id, search, is_active, page, limit } = req.query;

      const filters = {
        vehicle_id: vehicle_id ? parseInt(vehicle_id as string, 10) : undefined,
        search: search as string | undefined,
        is_active: is_active !== undefined
          ? (String(is_active) === 'true' || String(is_active) === '1')
          : true,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      };

      const result = await AgentService.findAll(filters, req.user);

      sendPaginated(res, result.data, result.total, filters.page, filters.limit);
    } catch (error) {
      sendError(res, 'Failed to get agents', 500);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const agent = await AgentService.getWithFiles(id, req.user);
      sendSuccess(res, agent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get agent';
      const statusCode =
        message === 'Agent not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agent = await AgentService.create(req.body, req.user);
      sendSuccess(res, agent, 'Agent created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create agent';
      const statusCode =
        message === 'Document ID already registered' ? 409 :
          message === 'Vehicle not found' ? 404 :
            message === 'Vehicle must be an escort vehicle' ? 400 :
              message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const agent = await AgentService.update(id, req.body, req.user);
      sendSuccess(res, agent, 'Agent updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update agent';
      const statusCode =
        message === 'Agent not found' ? 404 :
          message === 'Vehicle not found' ? 404 :
            message === 'Document ID already in use' ? 409 :
              message === 'Vehicle must be an escort vehicle' ? 400 :
                message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await AgentService.delete(id, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete agent';
      const statusCode =
        message === 'Agent not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }
}
