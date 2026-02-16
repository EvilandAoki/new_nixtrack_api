
import { pool } from '../config/database';

async function checkOrders() {
    try {
        const [orders] = await pool.query('SELECT COUNT(*) as count FROM track_order');
        console.log('Total Orders:', orders);

        // Also check if existing orders have client_id 5 (Ximena's client)
        const [myOrders] = await pool.query('SELECT COUNT(*) as count FROM track_order WHERE client_id = 5');
        console.log('Orders with Client ID 5:', myOrders);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkOrders();
