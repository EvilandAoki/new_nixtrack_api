import { pool } from '../config/database';
import { Department } from '../types';
import { RowDataPacket } from 'mysql2';

export class DepartmentModel {
  static async findAll(countryCode?: string): Promise<Department[]> {
    let query = 'SELECT id_department, code, name, country_code FROM sys_departments';
    const params: string[] = [];

    if (countryCode) {
      query += ' WHERE country_code = ?';
      params.push(countryCode);
    }

    query += ' ORDER BY name';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Department[];
  }

  static async findById(id: number): Promise<Department | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_department, code, name, country_code FROM sys_departments WHERE id_department = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Department) : null;
  }

  static async findByCode(code: string): Promise<Department | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_department, code, name, country_code FROM sys_departments WHERE code = ?',
      [code]
    );
    return rows.length > 0 ? (rows[0] as Department) : null;
  }
}
