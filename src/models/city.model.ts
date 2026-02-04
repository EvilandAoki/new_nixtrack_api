import { pool } from '../config/database';
import { City } from '../types';
import { RowDataPacket } from 'mysql2';

export class CityModel {
  static async findAll(departmentCode?: string): Promise<City[]> {
    let query = 'SELECT city_id, country_code, department_code, code, name FROM sys_cities';
    const params: string[] = [];

    if (departmentCode) {
      query += ' WHERE department_code = ?';
      params.push(departmentCode);
    }

    query += ' ORDER BY name';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as City[];
  }

  static async findById(id: number): Promise<City | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT city_id, country_code, department_code, code, name FROM sys_cities WHERE city_id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as City) : null;
  }

  static async findByCode(code: string): Promise<City | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT city_id, country_code, department_code, code, name FROM sys_cities WHERE code = ?',
      [code]
    );
    return rows.length > 0 ? (rows[0] as City) : null;
  }

  static async search(searchTerm: string, limit: number = 20): Promise<City[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT city_id, country_code, department_code, code, name
       FROM sys_cities
       WHERE name LIKE ?
       ORDER BY name
       LIMIT ?`,
      [`%${searchTerm}%`, limit]
    );
    return rows as City[];
  }
}
