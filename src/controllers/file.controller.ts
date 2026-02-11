import { Response } from 'express';
import { FileService } from '../services/file.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';

export class FileController {
  // Vehicle Files
  static async uploadVehicleFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const vehicleId = parseInt(req.params.id, 10);

      if (!req.file) {
        sendError(res, 'No file provided', 400);
        return;
      }

      const { description, is_main_photo } = req.body;
      const isMainPhoto = is_main_photo === 'true' || is_main_photo === true || is_main_photo === '1' || is_main_photo === 1;

      const file = await FileService.createVehicleFile(
        vehicleId,
        {
          filename: req.file.filename,
          path: `/${env.uploadPath}${req.file.filename}`,
          mimetype: req.file.mimetype,
        },
        description,
        isMainPhoto,
        req.user
      );

      sendSuccess(res, file, 'File uploaded successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async deleteVehicleFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const fileId = parseInt(req.params.fileId, 10);

      await FileService.deleteVehicleFile(vehicleId, fileId, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'File not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async setMainVehiclePhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const fileId = parseInt(req.params.fileId, 10);

      await FileService.setMainVehiclePhoto(vehicleId, fileId, req.user);
      sendSuccess(res, null, 'Main photo updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set main photo';
      const statusCode =
        message === 'Vehicle not found' ? 404 :
          message === 'File not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  // Order Files
  static async uploadOrderFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);

      if (!req.file) {
        sendError(res, 'No file provided', 400);
        return;
      }

      const { description } = req.body;

      const file = await FileService.createOrderFile(
        orderId,
        {
          filename: req.file.filename,
          path: `/${env.uploadPath}${req.file.filename}`,
          mimetype: req.file.mimetype,
        },
        description,
        req.user
      );

      sendSuccess(res, file, 'File uploaded successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async deleteOrderFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      const fileId = parseInt(req.params.fileId, 10);

      await FileService.deleteOrderFile(orderId, fileId, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'File not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  // Order Detail Files
  static async uploadOrderDetailFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const detailId = parseInt(req.params.id, 10);

      if (!req.file) {
        sendError(res, 'No file provided', 400);
        return;
      }

      const { description } = req.body;

      const file = await FileService.createOrderDetailFile(
        orderId,
        detailId,
        {
          filename: req.file.filename,
          path: `/${env.uploadPath}${req.file.filename}`,
          mimetype: req.file.mimetype,
        },
        description,
        req.user
      );

      sendSuccess(res, file, 'File uploaded successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Order detail not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async deleteOrderDetailFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const detailId = parseInt(req.params.id, 10);
      const fileId = parseInt(req.params.fileId, 10);

      await FileService.deleteOrderDetailFile(orderId, detailId, fileId, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Order detail not found' ? 404 :
            message === 'File not found' ? 404 :
              message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  // Agent Files
  static async uploadAgentFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agentId = parseInt(req.params.id, 10);

      if (!req.file) {
        sendError(res, 'No file provided', 400);
        return;
      }

      const { description, is_main_photo } = req.body;
      const isMainPhoto = is_main_photo === 'true' || is_main_photo === true || is_main_photo === '1' || is_main_photo === 1;

      const file = await FileService.createAgentFile(
        agentId,
        {
          filename: req.file.filename,
          path: `/${env.uploadPath}${req.file.filename}`,
          mimetype: req.file.mimetype,
        },
        description,
        isMainPhoto,
        req.user
      );

      sendSuccess(res, file, 'File uploaded successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      const statusCode =
        message === 'Agent not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async deleteAgentFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agentId = parseInt(req.params.id, 10);
      const fileId = parseInt(req.params.fileId, 10);

      await FileService.deleteAgentFile(agentId, fileId, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      const statusCode =
        message === 'Agent not found' ? 404 :
          message === 'File not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async setMainAgentPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      const agentId = parseInt(req.params.id, 10);
      const fileId = parseInt(req.params.fileId, 10);

      await FileService.setMainAgentPhoto(agentId, fileId, req.user);
      sendSuccess(res, null, 'Main photo updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set main photo';
      const statusCode =
        message === 'Agent not found' ? 404 :
          message === 'File not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }
}
