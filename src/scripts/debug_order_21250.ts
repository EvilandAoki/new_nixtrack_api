
import { OrderModel } from '../models/order.model';
import { pool } from '../config/database';

async function debugOrder() {
    try {
        const orders = await OrderModel.findAll({ search: '21250' });
        console.log('Order 21250 details:', orders.data[0]);
        if (orders.data[0]) {
            console.log('Status ID:', orders.data[0].status_id);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
debugOrder();
