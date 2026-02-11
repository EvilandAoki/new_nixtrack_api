import { pool } from '../config/database';
import { Agent, AgentWithVehicle, AgentFile, CreateAgentDto, UpdateAgentDto } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface AgentFilters {
  vehicle_id?: number;
  search?: string;
  is_active?: boolean;
  client_id?: number;
  page?: number;
  limit?: number;
}

export class AgentModel {
  private static readonly SELECT_FIELDS = `
    a.id, a.name, a.document_id, a.mobile, a.vehicle_id,
    a.is_active, a.created_at, a.created_by, a.updated_at, a.updated_by
  `;

  private static readonly SELECT_WITH_VEHICLE = `
    ${AgentModel.SELECT_FIELDS},
    v.license_plate as vehicle_plate,
    v.client_id
  `;

  static async findAll(filters: AgentFilters = {}): Promise<{ data: AgentWithVehicle[]; total: number }> {
    const { vehicle_id, search, is_active = true, client_id, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (is_active !== undefined) {
      conditions.push('a.is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (vehicle_id) {
      conditions.push('a.vehicle_id = ?');
      params.push(vehicle_id);
    }

    if (client_id) {
      conditions.push('v.client_id = ?');
      params.push(client_id);
    }

    if (search) {
      conditions.push('(a.name LIKE ? OR a.document_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM track_agent a
       LEFT JOIN track_vehicles v ON a.vehicle_id = v.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const query = `
      SELECT ${this.SELECT_WITH_VEHICLE}
      FROM track_agent a
      LEFT JOIN track_vehicles v ON a.vehicle_id = v.id
      ${whereClause}
      ORDER BY a.name
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return { data: rows as AgentWithVehicle[], total };
  }

  static async findById(id: number): Promise<AgentWithVehicle | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_WITH_VEHICLE}
       FROM track_agent a
       LEFT JOIN track_vehicles v ON a.vehicle_id = v.id
       WHERE a.id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as AgentWithVehicle) : null;
  }

  static async findByDocumentId(documentId: string): Promise<Agent | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS}
       FROM track_agent a
       WHERE a.document_id = ?`,
      [documentId]
    );
    return rows.length > 0 ? (rows[0] as Agent) : null;
  }

  static async create(data: CreateAgentDto, createdBy?: number): Promise<Agent> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO track_agent
        (name, document_id, mobile, vehicle_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.name,
        data.document_id || null,
        data.mobile || null,
        data.vehicle_id || null,
        createdBy || null,
      ]
    );
    const agent = await this.findById(result.insertId);
    return agent!;
  }

  static async update(id: number, data: UpdateAgentDto, updatedBy?: number): Promise<Agent | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.document_id !== undefined) {
      fields.push('document_id = ?');
      values.push(data.document_id || null);
    }
    if (data.mobile !== undefined) {
      fields.push('mobile = ?');
      values.push(data.mobile || null);
    }
    if (data.vehicle_id !== undefined) {
      fields.push('vehicle_id = ?');
      values.push(data.vehicle_id || null);
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
      `UPDATE track_agent SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number, deletedBy?: number): Promise<boolean> {
    // Soft delete by setting is_active = 0
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE track_agent SET is_active = 0, updated_by = ? WHERE id = ?`,
      [deletedBy || null, id]
    );
    return result.affectedRows > 0;
  }

  static async getFiles(agentId: number): Promise<AgentFile[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, agent_id, file_name, description, file_url, mime_type, is_main_photo, created_by, created_at, is_deleted
       FROM track_agent_files
       WHERE agent_id = ? AND is_deleted = 0
       ORDER BY is_main_photo DESC, created_at DESC`,
      [agentId]
    );
    return rows as AgentFile[];
  }
}
