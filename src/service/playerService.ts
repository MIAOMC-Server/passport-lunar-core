import { getPlayerInfo, insertPlayer } from '@repo/playerRepo'
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
        const playerInfo = await getPlayerInfo(player_uuid)
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
