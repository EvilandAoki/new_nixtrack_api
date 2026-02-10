import { pool } from '../config/database';
import { VehicleFile, OrderFile, OrderDetailFile, AgentFile } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface CreateVehicleFileData {
  vehicle_id: number;
  file_name: string;
  description?: string;
  file_url: string;
  mime_type?: string;
  is_main_photo?: boolean;
  created_by?: number;
}

export interface CreateAgentFileData {
  agent_id: number;
  file_name: string;
  description?: string;
  file_url: string;
  mime_type?: string;
  is_main_photo?: boolean;
  created_by?: number;
}

export interface CreateOrderFileData {
  shipment_id: number;
  file_name: string;
  description?: string;
  file_url: string;
  mime_type?: string;
  created_by?: number;
}

export interface CreateOrderDetailFileData {
  checkpoint_id: number;
  file_name: string;
  description?: string;
  file_url: string;
  mime_type?: string;
  created_by?: number;
}

export class FileModel {
  // Vehicle Files
  static async createVehicleFile(data: CreateVehicleFileData): Promise<VehicleFile> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_vehicle_files
        (vehicle_id, file_name, description, file_url, mime_type, is_main_photo, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.vehicle_id,
        data.file_name,
        data.description || null,
        data.file_url,
        data.mime_type || null,
        data.is_main_photo ? 1 : 0,
        data.created_by || null,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_vehicle_files WHERE id = ?`,
      [result.insertId]
    );
    return rows[0] as VehicleFile;
  }

  static async findVehicleFileById(id: number): Promise<VehicleFile | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_vehicle_files WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as VehicleFile) : null;
  }

  static async deleteVehicleFile(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_vehicle_files SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async setMainVehiclePhoto(vehicleId: number, fileId: number): Promise<void> {
    // First, unset all main photos for this vehicle
    await pool.query(
      `UPDATE track_vehicle_files SET is_main_photo = 0 WHERE vehicle_id = ?`,
      [vehicleId]
    );
    // Then set the new main photo
    await pool.query(
      `UPDATE track_vehicle_files SET is_main_photo = 1 WHERE id = ? AND vehicle_id = ?`,
      [fileId, vehicleId]
    );
  }

  // Order Files
  static async createOrderFile(data: CreateOrderFileData): Promise<OrderFile> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_order_files
        (shipment_id, file_name, description, file_url, mime_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.shipment_id,
        data.file_name,
        data.description || null,
        data.file_url,
        data.mime_type || null,
        data.created_by || null,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_order_files WHERE id = ?`,
      [result.insertId]
    );
    return rows[0] as OrderFile;
  }

  static async findOrderFileById(id: number): Promise<OrderFile | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_order_files WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as OrderFile) : null;
  }

  static async deleteOrderFile(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_order_files SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // Order Detail Files
  static async createOrderDetailFile(data: CreateOrderDetailFileData): Promise<OrderDetailFile> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_order_detail_files
        (checkpoint_id, file_name, description, file_url, mime_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.checkpoint_id,
        data.file_name,
        data.description || null,
        data.file_url,
        data.mime_type || null,
        data.created_by || null,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_order_detail_files WHERE id = ?`,
      [result.insertId]
    );
    return rows[0] as OrderDetailFile;
  }

  static async findOrderDetailFileById(id: number): Promise<OrderDetailFile | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_order_detail_files WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as OrderDetailFile) : null;
  }

  static async deleteOrderDetailFile(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_order_detail_files SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // Agent Files
  static async createAgentFile(data: CreateAgentFileData): Promise<AgentFile> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_agent_files
        (agent_id, file_name, description, file_url, mime_type, is_main_photo, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.agent_id,
        data.file_name,
        data.description || null,
        data.file_url,
        data.mime_type || null,
        data.is_main_photo ? 1 : 0,
        data.created_by || null,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_agent_files WHERE id = ?`,
      [result.insertId]
    );
    return rows[0] as AgentFile;
  }

  static async findAgentFileById(id: number): Promise<AgentFile | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM track_agent_files WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as AgentFile) : null;
  }

  static async deleteAgentFile(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_agent_files SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async setMainAgentPhoto(agentId: number, fileId: number): Promise<void> {
    // First, unset all main photos for this agent
    await pool.query(
      `UPDATE track_agent_files SET is_main_photo = 0 WHERE agent_id = ?`,
      [agentId]
    );
    // Then set the new main photo
    await pool.query(
      `UPDATE track_agent_files SET is_main_photo = 1 WHERE id = ? AND agent_id = ?`,
      [fileId, agentId]
    );
  }
}
