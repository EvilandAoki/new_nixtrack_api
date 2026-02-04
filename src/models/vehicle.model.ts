import { pool } from '../config/database';
import { Vehicle, VehicleWithClient, CreateVehicleDto, UpdateVehicleDto, VehicleFile } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface VehicleFilters {
  client_id?: number;
  is_escort_vehicle?: boolean;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export class VehicleModel {
  private static readonly SELECT_FIELDS = `
    v.id, v.client_id, v.license_plate, v.brand, v.vehicle_type,
    v.model_year, v.color, v.capacity, v.container, v.serial_numbers,
    v.is_escort_vehicle, v.is_active, v.created_at, v.created_by,
    v.updated_at, v.updated_by
  `;

  private static readonly SELECT_WITH_CLIENT = `
    ${VehicleModel.SELECT_FIELDS},
    c.company_name as client_name
  `;

  static async findAll(filters: VehicleFilters = {}): Promise<{ data: VehicleWithClient[]; total: number }> {
    const { client_id, is_escort_vehicle, search, is_active = true, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (is_active !== undefined) {
      conditions.push('v.is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (client_id) {
      conditions.push('v.client_id = ?');
      params.push(client_id);
    }

    if (is_escort_vehicle !== undefined) {
      conditions.push('v.is_escort_vehicle = ?');
      params.push(is_escort_vehicle ? 1 : 0);
    }

    if (search) {
      conditions.push('(v.license_plate LIKE ? OR v.brand LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM track_vehicles v ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const query = `
      SELECT ${this.SELECT_WITH_CLIENT}
      FROM track_vehicles v
      LEFT JOIN sys_clients c ON v.client_id = c.id_client
      ${whereClause}
      ORDER BY v.license_plate
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return { data: rows as VehicleWithClient[], total };
  }

  static async findById(id: number): Promise<VehicleWithClient | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_WITH_CLIENT}
       FROM track_vehicles v
       LEFT JOIN sys_clients c ON v.client_id = c.id_client
       WHERE v.id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as VehicleWithClient) : null;
  }

  static async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS}
       FROM track_vehicles v
       WHERE v.license_plate = ?`,
      [licensePlate]
    );
    return rows.length > 0 ? (rows[0] as Vehicle) : null;
  }

  static async create(data: CreateVehicleDto, createdBy?: number): Promise<Vehicle> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_vehicles
        (client_id, license_plate, brand, vehicle_type, model_year, color,
         capacity, container, serial_numbers, is_escort_vehicle, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.client_id,
        data.license_plate,
        data.brand || null,
        data.vehicle_type || null,
        data.model_year || null,
        data.color || null,
        data.capacity || null,
        data.container || null,
        data.serial_numbers || null,
        data.is_escort_vehicle ? 1 : 0,
        createdBy || null,
      ]
    );
    const vehicle = await this.findById(result.insertId);
    return vehicle!;
  }

  static async update(id: number, data: UpdateVehicleDto, updatedBy?: number): Promise<Vehicle | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    // Note: license_plate is immutable, not included in update
    if (data.brand !== undefined) {
      fields.push('brand = ?');
      values.push(data.brand || null);
    }
    if (data.vehicle_type !== undefined) {
      fields.push('vehicle_type = ?');
      values.push(data.vehicle_type || null);
    }
    if (data.model_year !== undefined) {
      fields.push('model_year = ?');
      values.push(data.model_year || null);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color || null);
    }
    if (data.capacity !== undefined) {
      fields.push('capacity = ?');
      values.push(data.capacity || null);
    }
    if (data.container !== undefined) {
      fields.push('container = ?');
      values.push(data.container || null);
    }
    if (data.serial_numbers !== undefined) {
      fields.push('serial_numbers = ?');
      values.push(data.serial_numbers || null);
    }
    if (data.is_escort_vehicle !== undefined) {
      fields.push('is_escort_vehicle = ?');
      values.push(data.is_escort_vehicle ? 1 : 0);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
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
      `UPDATE track_vehicles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number, deletedBy?: number): Promise<boolean> {
    // Soft delete by setting is_active = 0
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_vehicles SET is_active = 0, updated_by = ? WHERE id = ?`,
      [deletedBy || null, id]
    );
    return result.affectedRows > 0;
  }

  static async getFiles(vehicleId: number): Promise<VehicleFile[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, vehicle_id, file_name, description, file_url, mime_type,
              is_main_photo, created_by, created_at, is_deleted
       FROM track_vehicle_files
       WHERE vehicle_id = ? AND is_deleted = 0
       ORDER BY is_main_photo DESC, created_at DESC`,
      [vehicleId]
    );
    return rows as VehicleFile[];
  }

  static async getOrderHistory(vehicleId: number, limit: number = 10): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.id, o.order_number, o.status_id, s.name as status_name,
              o.origin_city_code, o.destination_city_code,
              o.departure_at, o.arrival_at, o.created_at
       FROM track_order o
       LEFT JOIN track_status s ON o.status_id = s.id
       WHERE o.vehicle_id = ? AND o.is_deleted = 0
       ORDER BY o.created_at DESC
       LIMIT ?`,
      [vehicleId, limit]
    );
    return rows;
  }
}
