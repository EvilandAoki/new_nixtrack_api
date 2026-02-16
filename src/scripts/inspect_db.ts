
import { pool } from '../config/database';

async function inspect() {
    try {
        const [roles] = await pool.query('SELECT * FROM sys_roles');
        console.log(JSON.stringify(roles, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

inspect();
