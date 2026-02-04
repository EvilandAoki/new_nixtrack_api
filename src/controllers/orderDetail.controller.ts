import { Response } from 'express';
import { OrderDetailService } from '../services/orderDetail.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class OrderDetailController {
  static async findByOrderId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const details = await OrderDetailService.findByOrderId(orderId, req.user);
      sendSuccess(res, details);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get order details';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const detailId = parseInt(req.params.id, 10);
      // Note: orderId might not be used in the service if detailId is unique, 
      // but we keep it for consistency with current code.
      const orderId = parseInt(req.params.orderId, 10);
      const detail = await OrderDetailService.getWithFiles(orderId, detailId, req.user);
      sendSuccess(res, detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get order detail';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Order detail not found' ? 404 :
            message === 'Access denied' ? 403 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      // If we are coming from /order-details (POST), orderId will be in body
      // If we are coming from /orders/:orderId/details (POST), it's in params
      const orderId = req.params.orderId ? parseInt(req.params.orderId, 10) : req.body.shipment_id;

      const detail = await OrderDetailService.create(orderId, req.body, req.user);
      sendSuccess(res, detail, 'Order detail created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order detail';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Access denied' ? 403 :
            message === 'Can only add reports to orders in transit' ? 400 :
              message.includes('Latitude') || message.includes('Longitude') ? 400 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const detailId = parseInt(req.params.id, 10);
      const detail = await OrderDetailService.update(orderId, detailId, req.body, req.user);
      sendSuccess(res, detail, 'Order detail updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order detail';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Order detail not found' ? 404 :
            message === 'Access denied' ? 403 :
              message === 'Can only add reports to orders in transit' ? 400 :
                message.includes('Latitude') || message.includes('Longitude') ? 400 : 500;
      sendError(res, message, statusCode);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const detailId = parseInt(req.params.id, 10);
      await OrderDetailService.delete(orderId, detailId, req.user);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete order detail';
      const statusCode =
        message === 'Order not found' ? 404 :
          message === 'Order detail not found' ? 404 :
            message === 'Access denied' ? 403 :
              message === 'Can only add reports to orders in transit' ? 400 : 500;
      sendError(res, message, statusCode);
    }
  }
}
