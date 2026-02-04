import { pool } from '../config/database';
import { User, UserWithRole, UpdateUserDto } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Internal type for creating users (password already hashed)
export interface CreateUserData {
  name: string;
  email: string;
  password_hash: string;
  document_id?: string;
  phone?: string;
  client_id?: number;
  position?: string;
  city_code?: string;
  role_id?: number;
  created_by?: number;
}

export class UserModel {
  // Base fields to select (excluding password_hash for security)
  private static readonly SELECT_FIELDS = `
    u.id, u.name, u.email, u.document_id, u.phone,
    u.client_id, u.position, u.city_code, u.role_id,
    u.is_active, u.created_at, u.created_by, u.updated_at, u.updated_by
  `;

  // Fields including role info
  private static readonly SELECT_WITH_ROLE = `
    ${UserModel.SELECT_FIELDS},
    r.name as role_name, r.is_admin
  `;

  // Fields including role and client info
  private static readonly SELECT_WITH_RELATIONS = `
    ${UserModel.SELECT_FIELDS},
    r.name as role_name, r.is_admin,
    c.company_name as client_name
  `;

  static async findAll(clientId?: number): Promise<UserWithRole[]> {
    let query = `
      SELECT ${this.SELECT_WITH_ROLE}
      FROM sys_users u
      LEFT JOIN sys_roles r ON u.role_id = r.id_role
      WHERE u.is_active = 1
    `;
    const params: number[] = [];

    if (clientId) {
      query += ' AND u.client_id = ?';
      params.push(clientId);
    }

    query += ' ORDER BY u.name';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as UserWithRole[];
  }

  static async findPaginated(
    page: number,
    limit: number,
    search: string,
    clientId?: number
  ): Promise<{ items: UserWithRole[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: any[] = [];

    let whereClause = 'WHERE u.is_active = 1';

    // Filter by client if provided
    if (clientId) {
      whereClause += ' AND u.client_id = ?';
      params.push(clientId);
    }

    // Search filter
    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.document_id LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sys_users u
      ${whereClause}
    `;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT ${this.SELECT_WITH_RELATIONS}
      FROM sys_users u
      LEFT JOIN sys_roles r ON u.role_id = r.id_role
      LEFT JOIN sys_clients c ON u.client_id = c.id_client
      ${whereClause}
      ORDER BY u.name
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...params, limit, offset]);

    return {
      items: rows as UserWithRole[],
      total,
    };
  }

  static async findById(id: number): Promise<UserWithRole | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${this.SELECT_WITH_ROLE}
       FROM sys_users u
       LEFT JOIN sys_roles r ON u.role_id = r.id_role
       WHERE u.id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as UserWithRole) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.*, r.name as role_name, r.is_admin
       FROM sys_users u
       LEFT JOIN sys_roles r ON u.role_id = r.id_role
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  static async findByEmailIncludeInactive(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM sys_users WHERE email = ?`,
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  static async create(data: CreateUserData): Promise<User> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO sys_users
        (name, email, document_id, password_hash, phone, client_id, position, city_code, role_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.document_id || null,
        data.password_hash,
        data.phone || null,
        data.client_id || null,
        data.position || null,
        data.city_code || null,
        data.role_id || null,
        data.created_by || null,
      ]
    );
    const user = await this.findById(result.insertId);
    return user!;
  }

  static async update(id: number, data: UpdateUserDto & { password_hash?: string; updated_by?: number }): Promise<User | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.document_id !== undefined) {
      fields.push('document_id = ?');
      values.push(data.document_id || null);
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone || null);
    }
    if (data.client_id !== undefined) {
      fields.push('client_id = ?');
      values.push(data.client_id || null);
    }
    if (data.position !== undefined) {
      fields.push('position = ?');
      values.push(data.position || null);
    }
    if (data.city_code !== undefined) {
      fields.push('city_code = ?');
      values.push(data.city_code || null);
    }
    if (data.role_id !== undefined) {
      fields.push('role_id = ?');
      values.push(data.role_id || null);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.updated_by !== undefined) {
      fields.push('updated_by = ?');
      values.push(data.updated_by);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query<ResultSetHeader>(
      `UPDATE sys_users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number, deletedBy?: number): Promise<boolean> {
    // Soft delete by setting is_active = 0
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE sys_users SET is_active = 0, updated_by = ? WHERE id = ?`,
      [deletedBy || null, id]
    );
    return result.affectedRows > 0;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM sys_users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}
