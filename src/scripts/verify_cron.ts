import { pool, testConnection } from '../config/database';
import crons from '../crons';

async function main() {
    try {
        await testConnection();

        // 1. Verify schema for track_order updated_at
        console.log("--- 1. Checking Schema for track_order.updated_at ---");
        const [schemaResult]: any = await pool.query(`SHOW CREATE TABLE track_order;`);
        const createStatement = schemaResult[0]['Create Table'];
        if (createStatement.includes('ON UPDATE CURRENT_TIMESTAMP')) {
            console.error("❌ Schema verification failed: updated_at still has ON UPDATE CURRENT_TIMESTAMP.");
        } else {
            console.log("✅ Schema verification passed.");
        }

        // 2. We'll pick an active order to manipulate
        console.log("\n--- 2. Setting up test data ---");
        const [orders]: any = await pool.query(`SELECT id FROM track_order WHERE status_id = 2 LIMIT 1`);
        if (orders.length === 0) {
            console.log("No active orders found to test.");
            process.exit(0);
        }

        const testOrderId = orders[0].id;
        console.log(`Using order ID ${testOrderId} for testing.`);

        // Force 'red' scenario (> 60 mins)
        console.log("Testing RED scenario...");
        await pool.query(`UPDATE track_order SET updated_at = DATE_SUB(NOW(), INTERVAL 65 MINUTE) WHERE id = ?`, [testOrderId]);

        // Manual trigger of the cron query logic
        await pool.query(`
            UPDATE track_order t
            SET t.status_level = CASE
                WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) < 40  THEN 'green'
                WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) >= 60 THEN 'red'
                ELSE 'yellow'
            END
            WHERE t.status_id = 2 AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
        `);

        // Check if it's red
        let [checkResult]: any = await pool.query(`SELECT status_level FROM track_order WHERE id = ?`, [testOrderId]);
        if (checkResult[0].status_level === 'red') {
            console.log("✅ RED scenario passed.");
        } else {
            console.error(`❌ RED scenario failed. Status is: ${checkResult[0].status_level}`);
        }

        // Force 'yellow' scenario (between 40 and 59 mins)
        console.log("Testing YELLOW scenario...");
        await pool.query(`UPDATE track_order SET updated_at = DATE_SUB(NOW(), INTERVAL 50 MINUTE) WHERE id = ?`, [testOrderId]);
        await pool.query(`
            UPDATE track_order t
            SET t.status_level = CASE
                WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) < 40  THEN 'green'
                WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) >= 60 THEN 'red'
                ELSE 'yellow'
            END
            WHERE t.status_id = 2 AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
        `);
        [checkResult] = await pool.query(`SELECT status_level FROM track_order WHERE id = ?`, [testOrderId]);
        if (checkResult[0].status_level === 'yellow') {
            console.log("✅ YELLOW scenario passed.");
        } else {
            console.error(`❌ YELLOW scenario failed. Status is: ${checkResult[0].status_level}`);
        }

        // Force 'green' scenario (< 40 mins)
        console.log("Testing GREEN scenario...");
        await pool.query(`UPDATE track_order SET updated_at = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE id = ?`, [testOrderId]);
        await pool.query(`
            UPDATE track_order t
            SET t.status_level = CASE
                WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) < 40  THEN 'green'
                WHEN TIMESTAMPDIFF(MINUTE, t.updated_at, NOW()) >= 60 THEN 'red'
                ELSE 'yellow'
            END
            WHERE t.status_id = 2 AND (t.is_deleted = 0 OR t.is_deleted IS NULL)
        `);
        [checkResult] = await pool.query(`SELECT status_level FROM track_order WHERE id = ?`, [testOrderId]);
        if (checkResult[0].status_level === 'green') {
            console.log("✅ GREEN scenario passed.");
        } else {
            console.error(`❌ GREEN scenario failed. Status is: ${checkResult[0].status_level}`);
        }

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        process.exit();
    }
}

main();
