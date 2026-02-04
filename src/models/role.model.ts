import { pool } from '../config/database';
import { Role } from '../types';
import { RowDataPacket } from 'mysql2';

export class RoleModel {
  static async findAll(): Promise<Role[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_role, name, is_admin FROM sys_roles ORDER BY name'
    );
    return rows as Role[];
  }

  static async findById(id: number): Promise<Role | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_role, name, is_admin FROM sys_roles WHERE id_role = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Role) : null;
  }

  static async findByName(name: string): Promise<Role | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_role, name, is_admin FROM sys_roles WHERE name = ?',
      [name]
    );
    return rows.length > 0 ? (rows[0] as Role) : null;
  }
}
