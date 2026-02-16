
import { OrderService } from '../services/order.service';
import { UserPayload } from '../types';

// Mock currentUser based on Ximena (Role 3, Client 5)
// Let's test BOTH number and string to see what happens
const userNumber: UserPayload = {
    id: 14,
    email: 'XIMENA@GMAIL.COM',
    role_id: 3,
    client_id: 5,
    is_admin: false,
};

const userString: UserPayload = {
    id: 14,
    email: 'XIMENA@GMAIL.COM',
    role_id: "3" as any, // Simulate string from JWT/DB
    client_id: 5,
    is_admin: false,
};

async function test() {
    console.log('--- TEST: role_id as NUMBER ---');
    await OrderService.findAll({}, userNumber);

    console.log('\n--- TEST: role_id as STRING ---');
    await OrderService.findAll({}, userString);

    process.exit();
}

test();
