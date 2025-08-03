import { db } from '@util/database'
import { appConfig } from '@util/getConfig'

const tablePrefix = appConfig('APP_DATABASE_TABLE_PREFIX', 'string')
// Start Player operations
interface getPlayerInfoReturn {
    status: boolean
    message?: string
    data?: {
        registered: boolean
        player_uuid?: string
        player_name?: string
        user_id?: string
        is_primary?: boolean
    }
}

export const getPlayerInfo = async (player_uuid: string): Promise<getPlayerInfoReturn> => {
    const sql = `SELECT * FROM ${tablePrefix}players WHERE player_uuid = ?`

    const result = await db.query(sql, [player_uuid])
    if (result.length === 0) {
        return { status: false, message: 'Player not registered', data: { registered: false } }
    }

    const playerData = result[0]

    return {
        status: true,
        data: {
            registered: true,
            player_uuid: playerData.player_uuid,
            player_name: playerData.player_name,
            user_id: playerData.user_id,
            is_primary: playerData.is_primary
        }
    }
}

interface InsertPlayerReturn {
    status: boolean
    message?: string
}

// 插入玩家
export const insertPlayer = async (
    player_uuid: string,
    player_name: string,
    user_id: number,
    is_primary: boolean = false
): Promise<InsertPlayerReturn> => {
    try {
        const sql = `INSERT INTO ${tablePrefix}players (player_uuid, player_name, user_id, player_role, is_primary) VALUES (?, ?, ?, ?, ?)`
        const result = await db.query(sql, [
            player_uuid,
            player_name,
            user_id,
            'default',
            is_primary
        ])

        if (!result.insertId) {
            return {
                status: false,
                message: 'Failed to insert player'
            }
        }

        return {
            status: true
        }
    } catch (error) {
        if (appConfig('APP_DEBUG', 'boolean')) {
            console.error('Error inserting player:', error)
            return {
                status: false,
                message: `Error inserting player: ${error}`
            }
        }
        return {
            status: false,
            message: 'Failed to insert player'
        }
    }
}

interface IsPlayerBindedReturn {
    status: boolean
    is_bind?: boolean
    message?: string
}
export const isPlayerBinded = async (player_uuid: string): Promise<IsPlayerBindedReturn> => {
    try {
        const playerInfo = await getPlayerInfo(player_uuid)
        if (playerInfo.status && playerInfo.data?.user_id) {
            return { status: true, is_bind: true, message: 'Player is binded' }
        }
        return { status: true, is_bind: false, message: 'Player is not binded' }
    } catch (error) {
        if (appConfig('APP_DEBUG', 'boolean')) {
            console.error('Error checking player bind:', error)
            return {
                status: false,
                message: `Error checking player bind: ${error}`
            }
        }
        return { status: false, message: 'Error checking player bind' }
    }
}
