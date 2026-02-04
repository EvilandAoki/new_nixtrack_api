import { pool } from '../config/database';
import { TrackStatus } from '../types';
import { RowDataPacket } from 'mysql2';

export class StatusModel {
  static async findAll(): Promise<TrackStatus[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name FROM track_status ORDER BY id'
    );
    return rows as TrackStatus[];
  }

  static async findById(id: number): Promise<TrackStatus | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name FROM track_status WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as TrackStatus) : null;
  }

  static async findByName(name: string): Promise<TrackStatus | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name FROM track_status WHERE name = ?',
      [name]
    );
    return rows.length > 0 ? (rows[0] as TrackStatus) : null;
  }
}
