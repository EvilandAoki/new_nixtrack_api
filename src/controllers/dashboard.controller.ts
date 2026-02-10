import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket } from 'mysql2';
import { sendSuccess, sendError } from '../utils/response';

interface DashboardOrder {
  id: number;
  client_id: number;
  client_name: string;
  vehicle_id: number | null;
  vehicle_plate: string | null;
  order_number: string | null;
  manifest_number: string | null;
  origin_city_code: string | null;
  origin_city_name: string | null;
  destination_city_code: string | null;
  destination_city_name: string | null;
  status_id: number | null;
  status_name: string | null;
  status_level: string | null;
  departure_at: Date | null;
  driver_name: string | null;
  driver_mobile: string | null;
  escort_name: string | null;
  last_report_id: number | null;
  last_report_at: Date | null;
  last_report_location: string | null;
  latitude: number | null;
  longitude: number | null;
}

export class DashboardController {
  static async getActiveOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user && !req.user.is_admin ? req.user.client_id : null;

      // Optimized query to get active orders with last report
      const query = `
        SELECT
          o.id,
          o.client_id,
          c.company_name as client_name,
          o.vehicle_id,
          v.license_plate as vehicle_plate,
          v.brand as vehicle_brand,
          o.order_number,
          o.manifest_number,
          o.origin_city_code,
          o.destination_city_code,
          oc.name as origin_city_name,
          dc.name as destination_city_name,
          o.status_id,
          s.name as status_name,
          o.status_level,
          o.departure_at,
          o.driver_name,
          o.driver_mobile,
          a.name as escort_name,
          d.id as last_report_id,
          d.reported_at as last_report_at,
          d.location_name as last_report_location,
          d.latitude,
          d.longitude
        FROM track_order o
        LEFT JOIN sys_clients c ON o.client_id = c.id_client
        LEFT JOIN track_vehicles v ON o.vehicle_id = v.id
        LEFT JOIN sys_cities oc ON o.origin_city_code = oc.code
        LEFT JOIN sys_cities dc ON o.destination_city_code = dc.code
        LEFT JOIN track_status s ON o.status_id = s.id
        LEFT JOIN track_agent a ON o.escort_id = a.id
        LEFT JOIN (
          SELECT d1.*
          FROM track_order_detail d1
          INNER JOIN (
            SELECT shipment_id, MAX(reported_at) as max_date
            FROM track_order_detail
            WHERE is_deleted = 0
            GROUP BY shipment_id
          ) d2 ON d1.shipment_id = d2.shipment_id AND d1.reported_at = d2.max_date
          WHERE d1.is_deleted = 0
        ) d ON o.id = d.shipment_id
        WHERE o.status_id = 2 AND o.is_deleted = 0
          AND (? IS NULL OR o.client_id = ?)
        ORDER BY o.status_level DESC, o.departure_at ASC
      `;

      const [rows] = await pool.query<RowDataPacket[]>(query, [clientId, clientId]);

      // Format the response
      const dashboardItems = (rows as any[]).map(row => ({
        id: row.id,
        client_id: row.client_id,
        vehicle_id: row.vehicle_id,
        order_number: row.order_number,
        manifest_number: row.manifest_number,
        origin_city_code: row.origin_city_code,
        destination_city_code: row.destination_city_code,
        status_id: row.status_id,
        status_level: row.status_level,
        departure_at: row.departure_at,
        driver_name: row.driver_name,
        driver_mobile: row.driver_mobile,
        client: {
          id_client: row.client_id,
          company_name: row.client_name,
        },
        vehicle: row.vehicle_id ? {
          id: row.vehicle_id,
          license_plate: row.vehicle_plate,
          brand: row.vehicle_brand,
        } : null,
        origin_city: row.origin_city_code ? {
          code: row.origin_city_code,
          name: row.origin_city_name,
        } : null,
        destination_city: row.destination_city_code ? {
          code: row.destination_city_code,
          name: row.destination_city_name,
        } : null,
        status: row.status_id ? {
          id: row.status_id,
          name: row.status_name,
        } : null,
        escort: row.escort_name ? {
          name: row.escort_name,
        } : null,
        last_report: row.last_report_id ? {
          id: row.last_report_id,
          reported_at: row.last_report_at,
          location_name: row.last_report_location,
          latitude: row.latitude,
          longitude: row.longitude,
        } : null,
      }));

      sendSuccess(res, dashboardItems);
    } catch (error) {
      console.error('Dashboard error:', error);
      sendError(res, 'Failed to get dashboard data', 500);
    }
  }

  static async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user && !req.user.is_admin ? req.user.client_id : null;
      const clientCondition = clientId ? 'AND client_id = ?' : '';
      const params = clientId ? [clientId] : [];

      // Get counts by status
      const [statusCounts] = await pool.query<RowDataPacket[]>(
        `SELECT
          s.id,
          s.name,
          COUNT(o.id) as count
        FROM track_status s
        LEFT JOIN track_order o ON s.id = o.status_id AND o.is_deleted = 0 ${clientCondition}
        GROUP BY s.id, s.name
        ORDER BY s.id`,
        params
      );

      // Get total active orders
      const [activeCount] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count
        FROM track_order
        WHERE status_id = 2 AND is_deleted = 0 ${clientCondition}`,
        params
      );

      // Get orders created today
      const [todayCount] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count
        FROM track_order
        WHERE DATE(created_at) = CURDATE() AND is_deleted = 0 ${clientCondition}`,
        params
      );

      // Get orders completed today
      const [completedTodayCount] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count
        FROM track_order
        WHERE status_id = 4 AND DATE(arrival_at) = CURDATE() AND is_deleted = 0 ${clientCondition}`,
        params
      );

      sendSuccess(res, {
        status_counts: statusCounts,
        active_orders: activeCount[0].count,
        orders_today: todayCount[0].count,
        completed_today: completedTodayCount[0].count,
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      sendError(res, 'Failed to get dashboard summary', 500);
    }
  }
}
