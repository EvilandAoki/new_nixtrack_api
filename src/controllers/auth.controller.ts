import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { UserModel } from '../models/user.model';
import { sendSuccess, sendError } from '../utils/response';

export class AuthController {
  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        password,
        document_id,
        phone,
        client_id,
        position,
        city_code,
        role_id,
      } = req.body;

      const createdBy = req.user?.id;

      const result = await AuthService.register(
        {
          name,
          email,
          password,
          document_id,
          phone,
          client_id,
          position,
          city_code,
          role_id,
        },
        createdBy
      );
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      const statusCode = message === 'Email already registered' ? 409 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const statusCode =
        message === 'Invalid credentials' || message === 'User account is inactive'
          ? 401
          : 500;
      sendError(res, message, statusCode);
    }
  }

  static async profile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        document_id: user.document_id,
        phone: user.phone,
        client_id: user.client_id,
        position: user.position,
        city_code: user.city_code,
        role_id: user.role_id,
        role_name: user.role_name,
        is_admin: user.is_admin,
        is_active: user.is_active,
        created_at: user.created_at,
      });
    } catch (error) {
      sendError(res, 'Failed to get profile', 500);
    }
  }
}
