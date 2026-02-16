
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

async function inspect(search: string) {
    try {
        console.log(`Checking user: ${search}`);
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, role_id, client_id, is_active FROM sys_users WHERE name LIKE ?',
            [`%${search}%`]
        );
        console.table(users);

        console.log('--- Roles ---');
        const [roles] = await pool.query<RowDataPacket[]>('SELECT * FROM sys_roles');
        console.table(roles);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspect('XIMENA'); // Assume name part
