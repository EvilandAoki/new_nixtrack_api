
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

async function inspect(search: string) {
    try {
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, role_id, client_id, is_active FROM sys_users WHERE name LIKE ?',
            [`%${search}%`]
        );
        console.log('--- User Info ---');
        console.log(JSON.stringify(users, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
inspect('XIMENA'); 
