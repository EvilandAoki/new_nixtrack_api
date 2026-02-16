import { pool } from '../config/database';
import { Order, OrderWithDetails, CreateOrderDto, UpdateOrderDto, OrderFile } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface OrderFilters {
  client_id?: number;
  vehicle_id?: number;
  status_id?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
  is_deleted?: boolean;
  page?: number;
  limit?: number;
}

export class OrderModel {
  private static readonly SELECT_FIELDS = `
    o.id, o.client_id, o.vehicle_id, o.manifest_number, o.insurance_company,
    o.origin_city_code, o.destination_city_code, o.route_description,
    o.status_level, o.distance_km, o.estimated_time, o.restrictions,
    o.tracking_link, o.notes, o.created_at, o.departure_at, o.arrival_at,
    o.status_id, o.driver_name, o.driver_mobile, o.order_number, o.escort_id,
    o.created_by, o.updated_at, o.updated_by, o.is_deleted, o.deleted_by, o.deleted_at
  `;

  private static readonly SELECT_WITH_DETAILS = `
    ${OrderModel.SELECT_FIELDS},
    c.company_name as client_name,
    v.license_plate as vehicle_plate,
    oc.name as origin_city_name,
    dc.name as destination_city_name,
    s.name as status_name,
    a.name as escort_name,
    a.mobile as escort_mobile
  `;

  static async findAll(filters: OrderFilters = {}): Promise<{ data: OrderWithDetails[]; total: number }> {
    const {
      client_id, vehicle_id, status_id, from_date, to_date,
      search, is_deleted = false, page = 1, limit = 20
    } = filters;
    const offset = (page - 1) * limit;
    const params: (string | number)[] = [];
    const conditions: string[] = ['o.is_deleted = ?'];
    params.push(is_deleted ? 1 : 0);

    if (client_id) {
      conditions.push('o.client_id = ?');
      params.push(client_id);
    }

    if (vehicle_id) {
      conditions.push('o.vehicle_id = ?');
      params.push(vehicle_id);
    }

    if (status_id) {
      conditions.push('o.status_id = ?');
      params.push(status_id);
    }

    if (from_date) {
      conditions.push('o.created_at >= ?');
      params.push(from_date);
    }

    if (to_date) {
      conditions.push('o.created_at <= ?');
      params.push(to_date);
    }

    if (search) {
      conditions.push('(o.order_number LIKE ? OR o.manifest_number LIKE ? OR v.license_plate LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM track_order o 
       LEFT JOIN track_vehicles v ON o.vehicle_id = v.id 
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const query = `
      SELECT ${this.SELECT_WITH_DETAILS}
      FROM track_order o
      LEFT JOIN sys_clients c ON o.client_id = c.id_client
      LEFT JOIN track_vehicles v ON o.vehicle_id = v.id
      LEFT JOIN sys_cities oc ON o.origin_city_code = oc.code
      LEFT JOIN sys_cities dc ON o.destination_city_code = dc.code
      LEFT JOIN track_status s ON o.status_id = s.id
      LEFT JOIN track_agent a ON o.escort_id = a.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return {
      data: rows.map(row => this.mapOrder(row)),
      total
    };
  }

  static async findById(id: number): Promise<OrderWithDetails | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_WITH_DETAILS}
       FROM track_order o
       LEFT JOIN sys_clients c ON o.client_id = c.id_client
       LEFT JOIN track_vehicles v ON o.vehicle_id = v.id
       LEFT JOIN sys_cities oc ON o.origin_city_code = oc.code
       LEFT JOIN sys_cities dc ON o.destination_city_code = dc.code
       LEFT JOIN track_status s ON o.status_id = s.id
       LEFT JOIN track_agent a ON o.escort_id = a.id
       WHERE o.id = ?`,
      [id]
    );
    return rows.length > 0 ? this.mapOrder(rows[0]) : null;
  }

  private static mapOrder(row: any): OrderWithDetails {
    const order: OrderWithDetails = { ...row };

    if (row.client_name || row.client_id) {
      order.client = {
        id_client: row.client_id,
        company_name: row.client_name,
      } as any;
    }

    if (row.vehicle_plate || row.vehicle_id) {
      order.vehicle = {
        id: row.vehicle_id,
        license_plate: row.vehicle_plate,
      } as any;
    }

    if (row.origin_city_name || row.origin_city_code) {
      order.origin_city = {
        code: row.origin_city_code,
        name: row.origin_city_name,
      } as any;
    }

    if (row.destination_city_name || row.destination_city_code) {
      order.destination_city = {
        code: row.destination_city_code,
        name: row.destination_city_name,
      } as any;
    }

    if (row.status_name || row.status_id) {
      order.status = {
        id: row.status_id,
        name: row.status_name,
      } as any;
    }

    if (row.escort_name || row.escort_id) {
      order.escort = {
        id: row.escort_id,
        name: row.escort_name,
        mobile: row.escort_mobile,
      } as any;
    }

    return order;
  }

  static async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS} FROM track_order o WHERE o.order_number = ?`,
      [orderNumber]
    );
    return rows.length > 0 ? (rows[0] as Order) : null;
  }

  static async create(data: CreateOrderDto, createdBy?: number): Promise<Order> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_order
        (client_id, vehicle_id, order_number, manifest_number, insurance_company,
         origin_city_code, destination_city_code, route_description, status_level,
         distance_km, estimated_time, restrictions, tracking_link, notes,
         departure_at, status_id, driver_name, driver_mobile, escort_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.client_id,
        data.vehicle_id || null,
        data.order_number,
        data.manifest_number || null,
        data.insurance_company || null,
        data.origin_city_code || null,
        data.destination_city_code || null,
        data.route_description || null,
        data.status_level || null,
        data.distance_km || null,
        data.estimated_time || null,
        data.restrictions || null,
        data.tracking_link || null,
        data.notes || null,
        data.departure_at || null,
        data.status_id || 1, // Default to Pendiente (1)
        data.driver_name || null,
        data.driver_mobile || null,
        data.escort_id || null,
        createdBy || null,
      ]
    );
    const order = await this.findById(result.insertId);
    return order!;
  }

  static async update(id: number, data: UpdateOrderDto, updatedBy?: number): Promise<Order | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.client_id !== undefined) {
      fields.push('client_id = ?');
      values.push(data.client_id || null);
    }
    if (data.order_number !== undefined) {
      fields.push('order_number = ?');
      values.push(data.order_number);
    }
    if (data.vehicle_id !== undefined) {
      fields.push('vehicle_id = ?');
      values.push(data.vehicle_id || null);
    }
    if (data.manifest_number !== undefined) {
      fields.push('manifest_number = ?');
      values.push(data.manifest_number || null);
    }
    if (data.insurance_company !== undefined) {
      fields.push('insurance_company = ?');
      values.push(data.insurance_company || null);
    }
    if (data.origin_city_code !== undefined) {
      fields.push('origin_city_code = ?');
      values.push(data.origin_city_code || null);
    }
    if (data.destination_city_code !== undefined) {
      fields.push('destination_city_code = ?');
      values.push(data.destination_city_code || null);
    }
    if (data.route_description !== undefined) {
      fields.push('route_description = ?');
      values.push(data.route_description || null);
    }
    if (data.status_level !== undefined) {
      fields.push('status_level = ?');
      values.push(data.status_level || null);
    }
    if (data.distance_km !== undefined) {
      fields.push('distance_km = ?');
      values.push(data.distance_km || null);
    }
    if (data.estimated_time !== undefined) {
      fields.push('estimated_time = ?');
      values.push(data.estimated_time || null);
    }
    if (data.restrictions !== undefined) {
      fields.push('restrictions = ?');
      values.push(data.restrictions || null);
    }
    if (data.tracking_link !== undefined) {
      fields.push('tracking_link = ?');
      values.push(data.tracking_link || null);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes || null);
    }
    if (data.departure_at !== undefined) {
      fields.push('departure_at = ?');
      values.push(data.departure_at || null);
    }
    if (data.status_id !== undefined) {
      fields.push('status_id = ?');
      values.push(data.status_id || null);
    }
    if (data.driver_name !== undefined) {
      fields.push('driver_name = ?');
      values.push(data.driver_name || null);
    }
    if (data.driver_mobile !== undefined) {
      fields.push('driver_mobile = ?');
      values.push(data.driver_mobile || null);
    }
    if (data.escort_id !== undefined) {
      fields.push('escort_id = ?');
      values.push(data.escort_id || null);
    }
    if (updatedBy !== undefined) {
      fields.push('updated_by = ?');
      values.push(updatedBy);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query<ResultSetHeader>(
      `UPDATE track_order SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async updateStatus(id: number, statusId: number, updatedBy?: number): Promise<Order | null> {
    const fields = ['status_id = ?', 'updated_by = ?'];
    const values: (number | null)[] = [statusId, updatedBy || null];

    // If status is Finalizado (4), set arrival_at
    if (statusId === 4) {
      fields.push('arrival_at = NOW()');
    }

    values.push(id);
    await pool.query<ResultSetHeader>(
      `UPDATE track_order SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number, deletedBy?: number): Promise<boolean> {
    // Soft delete by setting is_deleted = 1
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_order SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE id = ?`,
      [deletedBy || null, id]
    );
    return result.affectedRows > 0;
  }

  static async getFiles(orderId: number): Promise<OrderFile[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, shipment_id, file_name, description, file_url, mime_type,
              created_by, created_at, is_deleted
       FROM track_order_files
       WHERE shipment_id = ? AND is_deleted = 0
       ORDER BY created_at DESC`,
      [orderId]
    );
    return rows as OrderFile[];
  }
}
