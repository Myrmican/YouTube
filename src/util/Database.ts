import { Pool, PoolConnection } from 'mariadb';
import { createPool } from 'mariadb';

export class Database {

    private pool: Pool;

    constructor() {
        this.pool = createPool({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            port: parseInt(process.env.DATABASE_PORT as string),
            password: "",
            database: process.env.DATABASE_NAME,
            connectionLimit: 3,
            bigIntAsNumber: true,
            insertIdAsNumber: true,
        })
        // Database connection error handling
        this.pool.getConnection()
        .then(conn => {
            console.log('Database connection established');
            conn.release();
        })
        .catch(err => {
            console.error('Error connecting to database: ', err);
            process.exit(1);
        });
    }

    getConnection() {
        return this.pool.getConnection();
    }

    async query(query: string, values?: any[]) {
        const conn = await this.pool.getConnection();
        try {
            return await conn.query(query, values);
        } finally {
            conn.release();
        }
    }

    async batch(query: string, values: any[][]) {
        const conn = await this.pool.getConnection();
        try {
            return await conn.batch(query, values);
        } finally {
            conn.release();
        }
    }

    async transaction(fn: (conn: PoolConnection) => Promise<void>): Promise<void> {
        const conn = await this.pool.getConnection();
        await conn.beginTransaction();
        try {
            await fn(conn);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

const db = new Database();
export default db;