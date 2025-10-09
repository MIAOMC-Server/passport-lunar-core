import { db } from '@util/database'
import { appConfig } from '@util/getConfig'
import { logger } from '@util/logger'

const tablePrefix = appConfig('DATABASE_TABLE_PREFIX', 'string', '')

export const logActivity = async (
    userId: string | null = null,
    activityType: string,
    activityDetail: string
) => {
    try {
        await db.query(
            `INSERT INTO ${tablePrefix}activity_logs (user_id, activity_type, activity_detail) VALUES (?, ?, ?)`,
            [userId, activityType, activityDetail]
        )
    } catch (error) {
        logger.error('repo/ActivityLogsRepo', 'Failed to insert activity log', error)
    }
}
