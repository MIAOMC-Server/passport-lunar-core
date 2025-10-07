import { db } from '@util/database'
import { appConfig } from '@util/getConfig'
import { logger } from '@util/logger'

const tablePrefix = appConfig('DATABASE_TABLE_PREFIX', 'string')

export const logActivity = async ({
    user_id = 0,
    activity
}: {
    user_id: number | null
    activity: object
}) => {
    try {
        const sql = `INSERT INTO ${tablePrefix}activity_logs (user_id, activity) VALUES (?, ?)`
        await db.query(sql, [user_id, JSON.stringify(activity)])
    } catch (error) {
        logger.error('repo/ActivityLogsRepo', 'Error logging activity', error)
    }
}
