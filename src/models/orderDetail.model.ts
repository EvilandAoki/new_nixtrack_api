import { pool } from '../config/database';
import { OrderDetail, CreateOrderDetailDto, UpdateOrderDetailDto, OrderDetailFile } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class OrderDetailModel {
  private static readonly SELECT_FIELDS = `
    id, shipment_id, reported_at, reported_by, location_name,
    sequence_number, notes, updated_at, updated_by, latitude, longitude, is_deleted
  `;

  static async findByOrderId(orderId: number): Promise<OrderDetail[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS}
       FROM track_order_detail
       WHERE shipment_id = ? AND is_deleted = 0
       ORDER BY sequence_number ASC, reported_at ASC`,
      [orderId]
    );
    return rows as OrderDetail[];
  }

  static async findById(id: number): Promise<OrderDetail | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS}
       FROM track_order_detail
       WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as OrderDetail) : null;
  }

  static async create(orderId: number, data: CreateOrderDetailDto, reportedBy: string, createdBy?: number): Promise<OrderDetail> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_order_detail
        (shipment_id, reported_at, reported_by, location_name, sequence_number, notes, latitude, longitude)
       VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        reportedBy,
        data.location_name,
        data.sequence_number !== undefined ? data.sequence_number : 1, // Default to Sin Novedad (1)
        data.notes || null,
        data.latitude || null,
        data.longitude || null,
      ]
    );

    // After creating the detail, update the track_order's updated_at and updated_by fields for the cron
    await pool.query(
      `UPDATE track_order 
       SET updated_by = ?, updated_at = NOW() 
       WHERE id = ?`,
      [createdBy || null, orderId]
    );

    const detail = await this.findById(result.insertId);
    return detail!;
  }

  static async update(id: number, data: UpdateOrderDetailDto, updatedBy?: number): Promise<OrderDetail | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.location_name !== undefined) {
      fields.push('location_name = ?');
      values.push(data.location_name);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes || null);
    }
    if (data.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(data.latitude || null);
    }
    if (data.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(data.longitude || null);
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
      `UPDATE track_order_detail SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    // Soft delete by setting is_deleted = 1
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_order_detail SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getFiles(detailId: number): Promise<OrderDetailFile[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, checkpoint_id, file_name, description, file_url, mime_type,
              created_by, created_at, is_deleted
       FROM track_order_detail_files
       WHERE checkpoint_id = ? AND is_deleted = 0
       ORDER BY created_at DESC`,
      [detailId]
    );
    return rows as OrderDetailFile[];
  }
}
