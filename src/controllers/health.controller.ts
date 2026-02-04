import { Request, Response } from 'express';
import { pool } from '../config/database';

export class HealthController {
  static async check(_req: Request, res: Response): Promise<void> {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }

  static async checkDatabase(_req: Request, res: Response): Promise<void> {
    try {
      const start = Date.now();
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      const latency = Date.now() - start;

      res.json({
        status: 'ok',
        database: 'connected',
        latency_ms: latency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async checkDatabaseDetailed(_req: Request, res: Response): Promise<void> {
    try {
      const start = Date.now();
      const connection = await pool.getConnection();

      const [serverInfo] = await connection.query('SELECT VERSION() as version');
      const [statusResult] = await connection.query('SHOW STATUS WHERE Variable_name IN ("Threads_connected", "Uptime", "Questions")');

      connection.release();
      const latency = Date.now() - start;

      const status: Record<string, string> = {};
      (statusResult as Array<{ Variable_name: string; Value: string }>).forEach((row) => {
        status[row.Variable_name.toLowerCase()] = row.Value;
      });

      res.json({
        status: 'ok',
        database: {
          connected: true,
          version: (serverInfo as Array<{ version: string }>)[0].version,
          latency_ms: latency,
          threads_connected: parseInt(status.threads_connected || '0', 10),
          uptime_seconds: parseInt(status.uptime || '0', 10),
          total_queries: parseInt(status.questions || '0', 10),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(503).json({
        status: 'error',
        database: {
          connected: false,
          error: message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
