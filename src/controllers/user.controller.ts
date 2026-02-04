import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export class UserController {
  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      const search = (req.query.search as string) || '';

      const result = await UserService.findAllPaginated(req.user, page, limit, search);
      sendPaginated(res, result.items, result.total, page, limit);
    } catch (error) {
      sendError(res, 'Failed to get users', 500);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Only admins or users with client_id can create users
      if (!req.user?.is_admin && !req.user?.client_id) {
        sendError(res, 'Access denied', 403);
        return;
      }

      // If non-admin, force client_id to be their own
      const userData = req.body;
      if (!req.user.is_admin && req.user.client_id) {
        userData.client_id = req.user.client_id;
      }

      const user = await UserService.create(userData, req.user.id);
      sendSuccess(res, user, 'User created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      const statusCode = message === 'Email already in use' ? 409 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await UserService.findById(id);

      // Check access: admins can see all, others can only see users from their client
      if (
        req.user &&
        !req.user.is_admin &&
        req.user.client_id &&
        user.client_id !== req.user.client_id
      ) {
        sendError(res, 'Access denied', 403);
        return;
      }

      sendSuccess(res, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      const statusCode = message === 'User not found' ? 404 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      // Check if user has permission to update
      const targetUser = await UserService.findById(id);
      if (
        req.user &&
        !req.user.is_admin &&
        req.user.client_id &&
        targetUser.client_id !== req.user.client_id
      ) {
        sendError(res, 'Access denied', 403);
        return;
      }

      const user = await UserService.update(id, req.body, req.user?.id);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      const statusCode =
        message === 'User not found'
          ? 404
          : message === 'Email already in use'
            ? 409
            : 500;
      sendError(res, message, statusCode);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      // Check if user has permission to delete
      const targetUser = await UserService.findById(id);
      if (
        req.user &&
        !req.user.is_admin &&
        req.user.client_id &&
        targetUser.client_id !== req.user.client_id
      ) {
        sendError(res, 'Access denied', 403);
        return;
      }

      // Prevent self-deletion
      if (req.user && req.user.id === id) {
        sendError(res, 'Cannot delete your own account', 400);
        return;
      }

      await UserService.delete(id, req.user?.id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      const statusCode = message === 'User not found' ? 404 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async activate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      // Only admins can reactivate users
      if (!req.user?.is_admin) {
        sendError(res, 'Only administrators can activate users', 403);
        return;
      }

      const user = await UserService.activate(id, req.user.id);
      sendSuccess(res, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to activate user';
      const statusCode = message === 'User not found' ? 404 : 500;
      sendError(res, message, statusCode);
    }
  }
}
