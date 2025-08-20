import { appConfig } from '@util/getConfig'
import { createClient, RedisClientOptions } from 'redis'

const redisConfigs = {
    host: appConfig('REDIS_HOST', 'string'),
    port: appConfig('REDIS_PORT', 'number'),
    password: appConfig('REDIS_PASSWORD', 'string'),
    db: appConfig('REDIS_DB', 'number')
}

const redisUrl = `redis://default:${redisConfigs.password ? `${redisConfigs.password}@` : ''}${redisConfigs.host}:${redisConfigs.port}/${redisConfigs.db}`
const clientOptions: RedisClientOptions = {
    url: redisUrl,
    // 连接配置优化
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500), // 重连策略
        connectTimeout: 10000 // 连接超时
    }
}

class Redis {
    private static instance: Redis
    private client
    private isConnected: boolean = false

    private constructor() {
        this.client = createClient(clientOptions)
        this.setupEventHandlers()
    }

    public static getInstance(): Redis {
        if (!Redis.instance) {
            Redis.instance = new Redis()
        }
        return Redis.instance
    }

    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            console.log('Redis client connected')
            this.isConnected = true
        })

        this.client.on('error', (error) => {
            console.error('Redis client error:', error)
            this.isConnected = false
        })

        this.client.on('end', () => {
            console.log('Redis client disconnected')
            this.isConnected = false
        })
    }

    private async ensureConnected(): Promise<void> {
        if (!this.isConnected && !this.client.isOpen) {
            try {
                await this.client.connect()
            } catch (error) {
                console.error('Failed to connect to Redis:', error)
                throw error
            }
        }
    }

    public async connection(): Promise<void> {
        await this.ensureConnected()
    }

    public async get(key: string): Promise<string | null> {
        await this.ensureConnected()
        try {
            return await this.client.get(key)
        } catch (error) {
            console.error('Redis GET error:', error)
            throw error
        }
    }

    public async set(key: string, value: string, expireIn?: number): Promise<void> {
        await this.ensureConnected()
        try {
            if (expireIn) {
                await this.client.setEx(key, expireIn, value)
            } else {
                await this.client.set(key, value)
            }
        } catch (error) {
            console.error('Redis SET error:', error)
            throw error
        }
    }

    public async del(key: string): Promise<void> {
        await this.ensureConnected()
        try {
            await this.client.del(key)
        } catch (error) {
            console.error('Redis DEL error:', error)
            throw error
        }
    }

    public async renew(key: string, expireIn: number): Promise<void> {
        await this.ensureConnected()
        try {
            await this.client.expire(key, expireIn)
        } catch (error) {
            console.error('Redis RENEW error:', error)
            throw error
        }
    }

    // 新增方法：检查连接状态
    public isClientConnected(): boolean {
        return this.isConnected && this.client.isOpen
    }

    // 新增方法：获取 Redis 信息
    public async getInfo(): Promise<string> {
        await this.ensureConnected()
        return await this.client.info()
    }

    // 新增方法：关闭连接
    public async disconnect(): Promise<void> {
        if (this.client.isOpen) {
            await this.client.disconnect()
        }
    }

    // 新增方法：批量操作
    public async mget(keys: string[]): Promise<(string | null)[]> {
        await this.ensureConnected()
        try {
            return await this.client.mGet(keys)
        } catch (error) {
            console.error('Redis MGET error:', error)
            throw error
        }
    }

    public async mset(keyValuePairs: Record<string, string>): Promise<void> {
        await this.ensureConnected()
        try {
            await this.client.mSet(keyValuePairs)
        } catch (error) {
            console.error('Redis MSET error:', error)
            throw error
        }
    }
}

export default Redis
