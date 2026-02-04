---
name: mysql-repository
description: Implement MySQL data access with TypeScript using repository pattern, connection pooling, transactions, and Clean Architecture principles. Use when implementing database repositories, writing SQL queries, managing MySQL connections, handling transactions, implementing query builders, optimizing database performance, creating migrations, or integrating MySQL with domain entities. Triggers include MySQL queries, repository implementation, database transactions, connection pooling, SQL migrations, mysql2 library, query optimization, and data persistence layer.
---

# MySQL Repository

Implement Clean Architecture repositories with MySQL using mysql2 and connection pooling.

## Setup

### Connection Pool
```typescript
// infrastructure/database/connection.ts
import mysql from 'mysql2/promise';

export function createPool(config: DatabaseConfig) {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
}
```

### Database Service
```typescript
export class Database {
  constructor(private pool: mysql.Pool) {}

  async query<T>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }
}
```

## Repository Implementation

### Base Repository
```typescript
// infrastructure/database/BaseRepository.ts
export abstract class BaseRepository<TEntity, TId> {
  constructor(
    protected db: Database,
    protected tableName: string
  ) {}

  async findById(id: TId): Promise<TEntity | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const rows = await this.db.query<any[]>(sql, [id]);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async save(entity: TEntity): Promise<void> {
    const data = this.toPersistence(entity);
    const sql = this.buildUpsertQuery(data);
    await this.db.query(sql.query, sql.params);
  }

  async delete(id: TId): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.query(sql, [id]);
  }

  protected abstract toDomain(row: any): TEntity;
  protected abstract toPersistence(entity: TEntity): any;

  private buildUpsertQuery(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const insertClause = keys.join(', ');
    const valuesClause = keys.map(() => '?').join(', ');
    const updateClause = keys.map(k => `${k} = VALUES(${k})`).join(', ');

    return {
      query: `INSERT INTO ${this.tableName} (${insertClause}) 
              VALUES (${valuesClause}) 
              ON DUPLICATE KEY UPDATE ${updateClause}`,
      params: values
    };
  }
}
```

### Concrete Repository
```typescript
// infrastructure/database/UserRepository.ts
export class MySQLUserRepository 
  extends BaseRepository<User, string> 
  implements IUserRepository 
{
  constructor(db: Database) {
    super(db, 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const rows = await this.db.query<any[]>(sql, [email]);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async list(filters: UserFilters): Promise<User[]> {
    const { query, params } = this.buildListQuery(filters);
    const rows = await this.db.query<any[]>(query, params);
    return rows.map(row => this.toDomain(row));
  }

  protected toDomain(row: any): User {
    return new User(
      row.id,
      row.email,
      row.name,
      row.hashed_password,
      new Date(row.created_at)
    );
  }

  protected toPersistence(user: User): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      hashed_password: user.hashedPassword,
      created_at: user.createdAt
    };
  }

  private buildListQuery(filters: UserFilters) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.name) {
      conditions.push('name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    if (filters.createdAfter) {
      conditions.push('created_at > ?');
      params.push(filters.createdAfter);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    params.push(filters.limit || 100);
    params.push(filters.offset || 0);

    return {
      query: `SELECT * FROM users ${whereClause} 
              ORDER BY created_at DESC 
              LIMIT ? OFFSET ?`,
      params
    };
  }
}
```

## Transaction Handling

### Transaction Service
```typescript
export class TransactionManager {
  constructor(private db: Database) {}

  async execute<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
```

### Using Transactions
```typescript
export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private inventoryRepo: IInventoryRepository,
    private txManager: TransactionManager
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    return await this.txManager.execute(async (connection) => {
      // All operations use same connection
      await this.inventoryRepo.decrementStock(
        input.productId, 
        input.quantity,
        connection
      );

      const order = Order.create(input);
      await this.orderRepo.save(order, connection);

      return order;
    });
  }
}
```

## Query Patterns

### Parameterized Queries
Always use prepared statements:

```typescript
// GOOD: Parameterized
const user = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// BAD: String interpolation (SQL injection risk!)
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Batch Operations
```typescript
async saveBatch(users: User[]): Promise<void> {
  const values = users.map(u => this.toPersistence(u));
  
  const placeholders = values
    .map(() => '(?, ?, ?, ?)')
    .join(', ');
    
  const params = values.flatMap(v => 
    [v.id, v.email, v.name, v.hashed_password]
  );

  const sql = `INSERT INTO users (id, email, name, hashed_password) 
               VALUES ${placeholders}`;
               
  await this.db.query(sql, params);
}
```

### Complex Joins
```typescript
async findOrdersWithProducts(userId: string): Promise<Order[]> {
  const sql = `
    SELECT 
      o.id as order_id,
      o.total,
      o.status,
      o.created_at,
      p.id as product_id,
      p.name as product_name,
      p.price,
      oi.quantity
    FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    INNER JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  const rows = await this.db.query<any[]>(sql, [userId]);
  return this.groupToOrders(rows);
}

private groupToOrders(rows: any[]): Order[] {
  const ordersMap = new Map<string, any>();
  
  rows.forEach(row => {
    if (!ordersMap.has(row.order_id)) {
      ordersMap.set(row.order_id, {
        id: row.order_id,
        total: row.total,
        status: row.status,
        createdAt: row.created_at,
        items: []
      });
    }
    
    ordersMap.get(row.order_id).items.push({
      productId: row.product_id,
      name: row.product_name,
      price: row.price,
      quantity: row.quantity
    });
  });

  return Array.from(ordersMap.values()).map(this.toDomain);
}
```

## Migrations

### Migration Structure
```
migrations/
├── 001_create_users_table.sql
├── 002_create_products_table.sql
└── 003_add_user_indexes.sql
```

### Migration File
```sql
-- migrations/001_create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migration Runner
```typescript
// scripts/migrate.ts
import fs from 'fs';
import path from 'path';

async function runMigrations(db: Database) {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(
      path.join(migrationsDir, file),
      'utf-8'
    );
    await db.query(sql);
  }
}
```

## Performance Optimization

### Indexing Strategy
```sql
-- Single column index
CREATE INDEX idx_email ON users(email);

-- Composite index (order matters)
CREATE INDEX idx_user_created ON users(user_id, created_at);

-- Covering index
CREATE INDEX idx_user_email_name ON users(email, name);
```

### Query Optimization
```typescript
// Use EXPLAIN to analyze queries
async analyzeQuery(sql: string, params: any[]) {
  const explained = await this.db.query(
    `EXPLAIN ${sql}`,
    params
  );
  console.log('Query plan:', explained);
}

// Use indexes effectively
const users = await db.query(
  'SELECT * FROM users WHERE email = ? AND created_at > ?',
  [email, date]
  // Requires composite index on (email, created_at)
);
```

### Connection Pooling
```typescript
// Monitor pool status
setInterval(() => {
  const poolStatus = pool.pool;
  console.log('Pool:', {
    all: poolStatus._allConnections.length,
    free: poolStatus._freeConnections.length,
    queued: poolStatus._connectionQueue.length
  });
}, 60000);
```

## Error Handling

### MySQL Errors
```typescript
async save(user: User): Promise<void> {
  try {
    await this.db.query(/* ... */);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DuplicateEntityError('User', user.email);
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ReferenceNotFoundError('Foreign key constraint failed');
    }
    throw error;
  }
}
```

## Testing

### In-Memory Database
```typescript
// tests/setup/testDatabase.ts
export async function createTestDatabase(): Promise<Database> {
  const pool = createPool({
    host: 'localhost',
    database: 'test_db',
    /* ... */
  });

  // Run migrations
  await runMigrations(new Database(pool));
  
  return new Database(pool);
}

export async function cleanDatabase(db: Database) {
  await db.query('DELETE FROM order_items');
  await db.query('DELETE FROM orders');
  await db.query('DELETE FROM products');
  await db.query('DELETE FROM users');
}
```

### Repository Testing
```typescript
describe('UserRepository', () => {
  let db: Database;
  let repo: MySQLUserRepository;

  beforeAll(async () => {
    db = await createTestDatabase();
    repo = new MySQLUserRepository(db);
  });

  afterEach(async () => {
    await cleanDatabase(db);
  });

  it('should save and retrieve user', async () => {
    const user = User.create('test@example.com', 'password', 'Test');
    await repo.save(user);

    const retrieved = await repo.findById(user.id);
    expect(retrieved).toEqual(user);
  });
});
```

## Best Practices

1. **Always use parameterized queries** - Prevent SQL injection
2. **Use connection pooling** - Reuse connections efficiently
3. **Handle transactions properly** - Always rollback on error
4. **Map at boundaries** - toDomain/toPersistence separates concerns
5. **Index strategically** - Based on query patterns
6. **Monitor performance** - Use EXPLAIN for slow queries
7. **Test with real database** - Integration tests catch issues

## References

For advanced patterns:
- **Complex queries**: See references/query-patterns.md
- **Performance tuning**: See references/optimization.md
- **Migration strategies**: See references/migrations.md
