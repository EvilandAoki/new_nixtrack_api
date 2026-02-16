
import { OrderService } from '../services/order.service';
import { VehicleService } from '../services/vehicle.service';
import { AgentService } from '../services/agent.service';
import { UserService } from '../services/user.service';
import { UserPayload } from '../types';
import { pool } from '../config/database';

async function verify() {
    const operatorUser: UserPayload = {
        id: 999,
        email: 'test@operator.com',
        role_id: 2,
        client_id: null,
        is_admin: false,
    };

    console.log('--- Verifying Operator Access ---');

    try {
        console.log('1. Testing OrderService...');
        const result = await OrderService.findAll({}, operatorUser);
        console.log(`   [SUCCESS] Operator can list orders. Total: ${result.total}`);
    } catch (error: any) {
        console.error(`   [FAIL] Operator CANNOT list orders: ${error.message}`);
    }

    try {
        console.log(`2. Testing VehicleService...`);
        const vehicles = await VehicleService.findAll({}, operatorUser);
        console.log(`   [SUCCESS] Operator can list vehicles. Count: ${vehicles.total}`);
    } catch (error: any) {
        console.error(`   [FAIL] Operator CANNOT list vehicles: ${error.message}`);
    }

    try {
        console.log('3. Testing AgentService...');
        const agents = await AgentService.findAll({}, operatorUser);
        console.log(`   [SUCCESS] Operator can list agents. Count: ${agents.total}`);
    } catch (error: any) {
        console.error(`   [FAIL] Operator CANNOT list agents: ${error.message}`);
    }

    try {
        console.log('4. Testing UserService (Should FAIL)...');
        await UserService.findAll(operatorUser);
        console.error(`   [FAIL] Operator CAN list users! Access should be denied.`);
    } catch (error: any) {
        console.log(`   [SUCCESS] Operator denied access to users: ${error.message}`);
    }

    console.log('--- Done ---');
    await pool.end();
    process.exit(0);
}

verify().catch(async (err) => {
    console.error('Unhandled error:', err);
    await pool.end();
    process.exit(1);
});
