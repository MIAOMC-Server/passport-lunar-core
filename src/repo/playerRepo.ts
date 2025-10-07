import { db } from '@util/database'
import { appConfig } from '@util/getConfig'
import { logger } from '@util/logger'

const tablePrefix = appConfig('DATABASE_TABLE_PREFIX', 'string')

// Start Player operations
interface ReadPlayerInfoReturn {
    status: boolean
    message?: string
    data?: {
        registered: boolean
        player_uuid?: string
        player_name?: string
        user_id?: number
        is_primary?: boolean
    }
}

export const readPlayerInfo = async (player_uuid: string): Promise<ReadPlayerInfoReturn> => {
    try {
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
    } catch (error) {
        logger.error('repo/PlayerRepo', 'Error reading player info:', error)
        if (appConfig('DEBUG', 'boolean'))
            return {
                status: false,
                message: `Error reading player info: ${error}`
            }

        return { status: false, message: 'Failed to read player info' }
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
        logger.error('repo/PlayerRepo', 'Error inserting player:', error)
        if (appConfig('DEBUG', 'boolean'))
            return {
                status: false,
                message: `Error inserting player: ${error}`
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
        const playerInfo = await readPlayerInfo(player_uuid)
        if (playerInfo.status && playerInfo.data?.user_id) {
            return { status: true, is_bind: true, message: 'Player is Bound' }
        }
        return { status: true, is_bind: false, message: 'Player is not Bound' }
    } catch (error) {
        logger.error('repo/PlayerRepo', 'Error checking player bind:', error)
        if (appConfig('DEBUG', 'boolean'))
            return {
                status: false,
                message: `Error checking player bind: ${error}`
            }

        return { status: false, message: 'Error checking player bind' }
    }
}

interface ReadUserBindedPlayersReturn {
    status: boolean
    message?: string
    binded_players?: number
    data?: {
        player_uuid: string
        player_name: string
        user_id: number
        is_primary: boolean
        created_at: Date
    }[]
}

export const readUserBindedPlayers = async (
    type: 'player_uuid' | 'user_id',
    id: string | number
): Promise<ReadUserBindedPlayersReturn> => {
    try {
        let user_id: number
        if (type === 'player_uuid') {
            const sql = `SELECT * FROM ${tablePrefix}players WHERE player_uuid = ?`
            const result = await db.query(sql, [id])
            if (result.length === 0 || !result[0].user_id) {
                return { status: false, message: 'Player not found', data: [] }
            }
            user_id = result[0].user_id
        } else {
            user_id = Number(id)
        }

        const sql = `SELECT * FROM ${tablePrefix}players WHERE user_id = ?`
        const result = await db.query(sql, [user_id])
        if (result.length === 0) {
            return { status: false, message: 'User not found', data: [] }
        }

        return {
            status: true,
            binded_players: result.length,
            data: result.map(
                (player: {
                    player_uuid: string
                    player_name: string
                    user_id: number
                    is_primary: boolean
                    player_role: string
                    created_at: Date
                    updated_at: Date
                }) => ({
                    player_uuid: player.player_uuid,
                    player_name: player.player_name,
                    user_id: player.user_id,
                    is_primary: player.is_primary
                })
            )
        }
    } catch (error) {
        logger.error('repo/PlayerRepo', 'Error reading user bound players:', error)
        if (appConfig('DEBUG', 'boolean'))
            return {
                status: false,
                message: `Error reading user bound players: ${error}`
            }

        return {
            status: false,
            message: 'Error reading user bound players'
        }
    }
}

interface UnbindPlayerReturn {
    status: boolean
    message?: string
}
// 解绑玩家
export const unbindPlayer = async (player_uuid: string): Promise<UnbindPlayerReturn> => {
    try {
        const sql = `DELETE FROM ${tablePrefix}players WHERE player_uuid = ?`
        const result = await db.query(sql, [player_uuid])
        if (result.affectedRows === 0) {
            return { status: false, message: 'Player not found' }
        }
        return { status: true }
    } catch (error) {
        logger.error('repo/PlayerRepo', 'Error unbinding player:', error)
        if (appConfig('DEBUG', 'boolean'))
            return {
                status: false,
                message: `Error unbinding player: ${error}`
            }

        return {
            status: false,
            message: 'Error unbinding player'
        }
    }
}
