import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    ssl: { rejectUnauthorized: false },
  });
}

// Reuse pool across hot reloads in development
const pool = globalThis._mysqlPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._mysqlPool = pool;

export default pool;

/** Convert PostgreSQL $1 $2 … placeholders to MySQL ? */
function pgToMysql(sql: string): string {
  // Strip RETURNING clause — MySQL doesn't support it
  sql = sql.replace(/\s+RETURNING\s+[\w\s,*]+$/i, '');
  return sql.replace(/\$\d+/g, '?');
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute(pgToMysql(text), params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const [rows] = await pool.execute(pgToMysql(text), params);
  const arr = rows as T[];
  return arr[0] ?? null;
}

// pg-compatible result shape used inside transactions
type PgResult = { rows: Record<string, unknown>[]; insertId?: number };
type PgClient = { query: (text: string, params?: any[]) => Promise<PgResult> };

export async function withTransaction<T>(fn: (client: PgClient) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const client: PgClient = {
      query: async (text: string, params?: any[]): Promise<PgResult> => {
        const [result] = await conn.execute(pgToMysql(text), params);
        if (Array.isArray(result)) {
          return { rows: result as Record<string, unknown>[] };
        }
        return {
          rows: [],
          insertId: (result as mysql.ResultSetHeader).insertId,
        };
      },
    };
    const result = await fn(client);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
