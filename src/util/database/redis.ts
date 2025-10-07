import { appConfig } from '@util/getConfig'
import { logger } from '@util/logger'
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
            logger.info('service/Database', 'Redis client connected')
            this.isConnected = true
        })

        this.client.on('error', (error) => {
            logger.error('service/Database', 'Redis client error:', error)
            this.isConnected = false
        })

        this.client.on('end', () => {
            logger.info('service/Database', 'Redis client disconnected')
            this.isConnected = false
        })
    }

    private async ensureConnected(): Promise<void> {
        if (!this.isConnected && !this.client.isOpen) {
            try {
                await this.client.connect()
            } catch (error) {
                logger.critical('service/Database', 'Failed to connect to Redis:', error)
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
            logger.error('service/Database', 'Redis GET error:', error)
            throw error
        }
    }

    public async getTTL(key: string): Promise<number | null> {
        await this.ensureConnected()
        try {
            return await this.client.ttl(key)
        } catch (error) {
            logger.error('service/Database', 'Redis TTL error:', error)
            throw error
        }
    }

    public async getJSON(key: string): Promise<string | null> {
        await this.ensureConnected()
        try {
            const result = await this.client.get(key)
            return result ? JSON.parse(result) : null
        } catch (error) {
            logger.error('service/Database', 'Redis GET error:', error)
            throw error
        }
    }

    public async set(key: string, value: string, expireIn?: number | null): Promise<void> {
        await this.ensureConnected()
        try {
            if (expireIn) {
                await this.client.setEx(key, expireIn, value)
            } else {
                await this.client.set(key, value)
            }
        } catch (error) {
            logger.error('service/Database', 'Redis SET error:', error)
            throw error
        }
    }

    public async del(key: string): Promise<void> {
        await this.ensureConnected()
        try {
            await this.client.del(key)
        } catch (error) {
            logger.error('service/Database', 'Redis DEL error:', error)
            throw error
        }
    }

    public async renew(key: string, expireIn: number): Promise<void> {
        await this.ensureConnected()
        try {
            await this.client.expire(key, expireIn)
        } catch (error) {
            logger.error('service/Database', 'Redis RENEW error:', error)
            throw error
        }
    }

    public async sAdd(key: string, member: string | string[]): Promise<void> {
        await this.ensureConnected()
        await this.client.sAdd(key, member)
    }

    public async sMembers(key: string): Promise<string[]> {
        await this.ensureConnected()
        return await this.client.sMembers(key)
    }

    public async sRem(key: string, member: string | string[]): Promise<void> {
        await this.ensureConnected()
        await this.client.sRem(key, member)
    }

    // 新增方法：检查连接状态
    public isClientConnected(): boolean {
        return this.client.isOpen
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
            logger.error('service/Database', 'Redis MGET error:', error)
            throw error
        }
    }

    public async mset(keyValuePairs: Record<string, string>): Promise<void> {
        await this.ensureConnected()
        try {
            await this.client.mSet(keyValuePairs)
        } catch (error) {
            logger.error('service/Database', 'Redis MSET error:', error)
            throw error
        }
    }
}

export default Redis
