import { pool } from '../config/database';
import { Client, CreateClientDto, UpdateClientDto } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface ClientFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export class ClientModel {
  private static readonly SELECT_FIELDS = `
    id_client, company_name, tax_id, phone, address, email,
    country_id, city_id, is_active, created_at, created_by,
    updated_at, updated_by
  `;

  static async findAll(filters: ClientFilters = {}): Promise<{ data: Client[]; total: number }> {
    const { search, is_active, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (is_active !== undefined) {
      conditions.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (search) {
      conditions.push('(company_name LIKE ? OR tax_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sys_clients ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const query = `
      SELECT ${this.SELECT_FIELDS}
      FROM sys_clients
      ${whereClause}
      ORDER BY company_name
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return { data: rows as Client[], total };
  }

  static async findById(id: number): Promise<Client | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS} FROM sys_clients WHERE id_client = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as Client) : null;
  }

  static async findByTaxId(taxId: string): Promise<Client | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS} FROM sys_clients WHERE tax_id = ?`,
      [taxId]
    );
    return rows.length > 0 ? (rows[0] as Client) : null;
  }

  static async findByTaxIdIncludeInactive(taxId: string): Promise<Client | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_FIELDS} FROM sys_clients WHERE tax_id = ?`,
      [taxId]
    );
    return rows.length > 0 ? (rows[0] as Client) : null;
  }

  static async create(data: CreateClientDto, createdBy?: number): Promise<Client> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO sys_clients
        (company_name, tax_id, phone, address, email, country_id, city_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.company_name,
        data.tax_id,
        data.phone || null,
        data.address || null,
        data.email || null,
        data.country_id || null,
        data.city_id || null,
        createdBy || null,
      ]
    );
    const client = await this.findById(result.insertId);
    return client!;
  }

  static async update(id: number, data: UpdateClientDto, updatedBy?: number): Promise<Client | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.company_name !== undefined) {
      fields.push('company_name = ?');
      values.push(data.company_name);
    }
    if (data.tax_id !== undefined) {
      fields.push('tax_id = ?');
      values.push(data.tax_id);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone || null);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address || null);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email || null);
    }
    if (data.country_id !== undefined) {
      fields.push('country_id = ?');
      values.push(data.country_id || null);
    }
    if (data.city_id !== undefined) {
      fields.push('city_id = ?');
      values.push(data.city_id || null);
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
      `UPDATE sys_clients SET ${fields.join(', ')} WHERE id_client = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number, deletedBy?: number): Promise<boolean> {
    // Soft delete by setting is_active = 0
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE sys_clients SET is_active = 0, updated_by = ? WHERE id_client = ?`,
      [deletedBy || null, id]
    );
    return result.affectedRows > 0;
  }
}
