import * as cron from 'node-cron';
import { pool } from '../config/database';
import { env } from '../config/env';

export class CronStatus {
    private oneMinuteTask: cron.ScheduledTask | null = null;

    constructor() { }

    async start() {
        this.oneMinuteTask = cron.schedule(
            `*/${env.cronStatusMinutes} * * * *`,
            async () => {
                try {
                    const [rowsToUpdate]: any = await pool.query(`
                        SELECT id, order_number, status_level as old_status, 
                            CASE 
                                WHEN TIMESTAMPDIFF(MINUTE, updated_at, NOW()) < 40 THEN 'green'
                                WHEN TIMESTAMPDIFF(MINUTE, updated_at, NOW()) >= 60 THEN 'red'
                                ELSE 'yellow'
                            END as new_status
                        FROM track_order
                        WHERE status_id = 2 
                          AND (is_deleted = 0 OR is_deleted IS NULL)
                          AND (status_level IS NULL OR status_level != CASE 
                                WHEN TIMESTAMPDIFF(MINUTE, updated_at, NOW()) < 40 THEN 'green'
                                WHEN TIMESTAMPDIFF(MINUTE, updated_at, NOW()) >= 60 THEN 'red'
                                ELSE 'yellow'
                            END)
                    `);

                    if (rowsToUpdate.length > 0) {
                        console.log(`\n--- Ejecución Cron Semáforo: ${new Date().toLocaleString()} ---`);
                        for (const row of rowsToUpdate) {
                            console.log(`[Status Change] Órden ${row.order_number}: ${row.old_status || 'Ninguno'} -> ${row.new_status}`);
                        }

                        const [result]: any = await pool.query(
                            `
                            UPDATE track_order t
                            SET t.status_level = CASE
                                    WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) < 40  THEN 'green'
                                    WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) >= 60 THEN 'red'
                                    ELSE 'yellow'
                                END,
                                t.updated_at = t.updated_at
                            WHERE t.status_id = 2
                              AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
                              AND (t.status_level IS NULL OR t.status_level != CASE 
                                    WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) < 40 THEN 'green'
                                    WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) >= 60 THEN 'red'
                                    ELSE 'yellow'
                                END)
                            `
                        );
                        console.log(`Total filas actualizadas: ${result.changedRows || result.affectedRows}\n--- Fin Semáforo ---\n`);
                    }
                } catch (error) {
                    console.error("Error en cron semáforo:", error);
                }
            }
        );
    }
}
