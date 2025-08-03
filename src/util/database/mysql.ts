import { appConfig } from '@util/getConfig'
import mysql, { PoolOptions } from 'mysql2/promise'

const poolConfig: PoolOptions = {
    host: appConfig('DATABASE_HOST', 'string') as string,
    port: appConfig('DATABASE_PORT', 'number') as number,
    user: appConfig('DATABASE_USER', 'string') as string,
    password: appConfig('DATABASE_PASSWORD', 'string') as string,
    database: appConfig('DATABASE_NAME', 'string') as string
}

class MySQL {
    private static instance: MySQL
    private pool: mysql.Pool

    private constructor() {
        this.pool = mysql.createPool(poolConfig)
    }

    public static getInstance(): MySQL {
        if (!MySQL.instance) {
            MySQL.instance = new MySQL()
        }
        return MySQL.instance
    }

    public async getConnection(): Promise<mysql.PoolConnection> {
        return await this.pool.getConnection()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async query(sql: string, params?: any[]): Promise<any> {
        const connection = await this.getConnection()
        try {
            const [results] = await connection.execute(sql, params)
            return results
        } finally {
            connection.release()
        }
    }

    public async close(): Promise<void> {
        await this.pool.end()
    }
}

export default MySQL
