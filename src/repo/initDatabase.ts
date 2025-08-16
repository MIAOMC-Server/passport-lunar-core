import { db } from '@util/database/index'
import { appConfig } from '@util/getConfig'

export const initDatabase = async () => {
    const prefix = appConfig('DATABASE_TABLE_PREFIX', 'string')

    const expectedTables = [`users`, `players`, `login_logs`, `activity_logs`] as const

    const expectedTableStructure = {
        users: [
            'id',
            'email',
            'username',
            'nickname',
            'password',
            'global_role',
            'created_at',
            'updated_at'
        ],
        players: [
            'player_uuid',
            'player_name',
            'user_id',
            'is_primary',
            'player_role',
            'created_at',
            'updated_at'
        ],
        login_logs: ['id', 'user_id', 'ip_address', 'user_agent', 'created_at'],
        activity_logs: ['id', 'user_id', 'activity_type', 'activity_detail', 'created_at']
    }

    const StructureSql = [
        // 用户表
        `CREATE TABLE IF NOT EXISTS ${prefix}users (
            id INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            username VARCHAR(50) NOT NULL,
            nickname VARCHAR(50),
            password VARCHAR(255),
            global_role VARCHAR(50) NOT NULL DEFAULT 'default',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

        // 玩家表
        `CREATE TABLE IF NOT EXISTS ${prefix}players (
            player_uuid VARCHAR(36) UNIQUE PRIMARY KEY,
            player_name VARCHAR(50) NOT NULL,
            user_id INT NOT NULL,
            is_primary BOOLEAN NOT NULL DEFAULT false,
            player_role VARCHAR(50) DEFAULT 'default',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES ${prefix}users(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

        // 登录日志
        `CREATE TABLE IF NOT EXISTS ${prefix}login_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            ip_address VARCHAR(45) NOT NULL,
            user_agent VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES ${prefix}users(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

        // 活动日志
        `CREATE TABLE IF NOT EXISTS ${prefix}activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            activity_type VARCHAR(255) NOT NULL,
            activity_detail VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES ${prefix}users(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    ]

    for (const sql of StructureSql) {
        try {
            await db.query(sql)
            if (appConfig('DEBUG', 'boolean')) {
                console.log(`Table structure created/verified successfully`)
            }
        } catch (error) {
            console.error(`Failed to create table:`, error)
        }
    }

    for (const table of expectedTables) {
        const isTableCorrect = await checkTableColumns(
            `${prefix}${table}`,
            expectedTableStructure[table]
        )
        if (!isTableCorrect) {
            console.error(`Table ${prefix}${table} structure is incorrect`)
        } else {
            if (appConfig('DEBUG', 'boolean')) {
                console.log(`Table ${prefix}${table} structure is correct`)
            }
        }
    }
}

const checkTableColumns = async (
    tableName: string,
    expectedColumns: string[]
): Promise<boolean> => {
    try {
        const tableExistsResult = await db.query(`SHOW TABLES LIKE '${tableName}'`)

        if (!tableExistsResult || tableExistsResult.length === 0) {
            console.error(`Error: Table ${tableName} does not exist`)
            return false
        }

        const columnsResult = await db.query(`DESCRIBE ${tableName}`)

        if (!columnsResult || !Array.isArray(columnsResult)) {
            console.error(`Error: Unable to describe table ${tableName}`)
            return false
        }

        const existingColumns = columnsResult.map((row: { Field: string }) => row.Field)

        const missingColumns: string[] = []
        for (const expectedColumn of expectedColumns) {
            if (!existingColumns.includes(expectedColumn)) {
                missingColumns.push(expectedColumn)
            }
        }

        if (missingColumns.length > 0) {
            console.error(
                `Error: Table ${tableName} is missing columns: ${missingColumns.join(', ')}`
            )
            return false
        }

        const extraColumns = existingColumns.filter((col: string) => !expectedColumns.includes(col))
        if (extraColumns.length > 0) {
            console.warn(
                `Warning: Table ${tableName} has extra columns: ${extraColumns.join(', ')}`
            )
        }

        return true
    } catch (error) {
        console.error(`Error checking table ${tableName}:`, error)
        return false
    }
}
