import {
    insertPlayer,
    isPlayerBinded,
    readPlayerInfo,
    readUserBindedPlayers
} from '@repo/playerRepo'
import { appConfig } from '@util/getConfig'

interface CreatePlayerReturn {
    status: boolean
    message?: string
}

export const createPlayer = async (
    player_uuid: string,
    player_name: string,
    user_id: number,
    is_primary: boolean = false
): Promise<CreatePlayerReturn> => {
    try {
        const playerInfo = await readPlayerInfo(player_uuid)
        if (playerInfo.status) {
            return { status: false, message: 'player already exists' }
        }

        const repoReturns = await insertPlayer(player_uuid, player_name, user_id, is_primary)

        if (!repoReturns.status) {
            return { status: false, message: 'Failed when creating player' }
        }

        return {
            status: true
        }
    } catch (error) {
        if (appConfig('APP_DEBUG', 'boolean')) {
            return { status: false, message: `Something went wrong when create player: ${error}` }
        }
        return {
            status: false,
            message: 'failed to create player'
        }
    }
}

interface ProcessPlayerNextReturn {
    status: boolean
    message?: string
    data?: {
        player_uuid: string
        player_name: string
        user_id: number
    }
    binded_players_data?: {
        player_uuid: string
        player_name: string
        user_id: number
        is_primary: boolean
        created_at: Date
    }[]
    next: 'Bind' | 'Login' | 'Create' | 'Failed' | 'Select'
}

export const processPlayerNext = async (player_uuid: string): Promise<ProcessPlayerNextReturn> => {
    //先检查玩家是否绑定
    const playerBinded = await isPlayerBinded(player_uuid)
    if (!playerBinded.status) {
        return {
            status: false,
            next: 'Failed',
            message: appConfig('APP_DEBUG', 'boolean')
                ? playerBinded.message
                : 'Error when checking player bind status'
        }
    }

    //如果玩家没有绑定
    if (playerBinded.is_bind === false) {
        return {
            status: true,
            next: 'Bind'
        }
    }

    //获取玩家信息
    const playerInfo = await readPlayerInfo(player_uuid)
    if (!playerInfo.status) {
        return {
            status: false,
            next: 'Failed',
            message: appConfig('APP_DEBUG', 'boolean')
                ? playerInfo.message
                : 'Error when reading player info'
        }
    }

    //如果玩家是主要玩家
    if (playerInfo.data?.is_primary) {
        //获取关联子玩家
        const bindedPlayers = await readUserBindedPlayers('player_uuid', player_uuid)

        //错误处理
        if (bindedPlayers.status === false) {
            return {
                status: false,
                next: 'Failed',
                message: appConfig('APP_DEBUG', 'boolean')
                    ? bindedPlayers.message
                    : 'Error when reading binded players'
            }
        }

        //如果该账号下有其他子玩家
        if (bindedPlayers.binded_players! > 1) {
            return {
                status: true,
                next: 'Select',
                binded_players_data: bindedPlayers.data
            }
        }
    }
    //如果没有子玩家
    const playerData = {
        player_uuid: playerInfo.data?.player_uuid as string,
        player_name: playerInfo.data?.player_name as string,
        user_id: playerInfo.data?.user_id as number
    }
    return {
        status: true,
        next: 'Login',
        data: playerData
    }
}
