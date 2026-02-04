import { Response } from 'express';
import { RoleModel } from '../models/role.model';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class RoleController {
  static async findAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const roles = await RoleModel.findAll();
      sendSuccess(res, roles);
    } catch (error) {
      sendError(res, 'Failed to get roles', 500);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const role = await RoleModel.findById(id);

      if (!role) {
        sendError(res, 'Role not found', 404);
        return;
      }

      sendSuccess(res, role);
    } catch (error) {
      sendError(res, 'Failed to get role', 500);
    }
  }
}
