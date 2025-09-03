import { bindTokenMiddleware } from '@middleware/bindMid'
import { bindWithExistAccount, bindWithNewAccount } from '@service/bindService'
import { createPlayer } from '@service/playerService'
import { checkEmpty } from '@util/commonUtils'
import express from 'express'

const bindRouter = express.Router()

// 使用中间件
bindRouter.use(bindTokenMiddleware)

bindRouter.post('/bind/:type', async (req, res) => {
    const bindMiddleware = res.locals.middleware
    if (!bindMiddleware || !bindMiddleware.status || !bindMiddleware.data) {
        return res.status(401).json({
            status: false,
            message: bindMiddleware?.message || 'Unauthorized'
        })
    }

    const { puuid } = req.body || {}

    // 验证请求的玩家UUID是否与Token一致
    if (puuid !== (bindMiddleware.data.player_uuid as string)) {
        return res.status(400).json({
            status: false,
            message: 'Player UUID does not match token'
        })
    }

    const { type } = req.params

    if (type === 'new') {
        return await handleNewAccountBind(req, res, puuid)
    }

    if (type === 'exist') {
        return await handleExistingAccountBind(req, res, puuid)
    }
})

const handleExistingAccountBind = async (
    req: express.Request,
    res: express.Response,
    puuid: string
) => {
    const { email, username, step, password } = req.body || {}
    if (checkEmpty(email, username, step, password))
        return res.status(400).json({ status: false, message: 'Invalid parameters' })

    const verifyResult = await bindWithExistAccount(email, password)
    if (!verifyResult.status || !verifyResult.data?.user_id)
        return res.status(400).json({
            status: false,
            message: verifyResult.message || 'Failed to bind account'
        })

    const createPlayerResult = await createPlayer(puuid, username, verifyResult.data.user_id, false)
    if (!createPlayerResult.status)
        return res.status(400).json({
            status: false,
            message: createPlayerResult.message || 'Failed to bind account'
        })

    return res.status(200).json({ status: true, message: 'Successfully bound account' })
}

const handleNewAccountBind = async (req: express.Request, res: express.Response, puuid: string) => {
    const { email, username, step } = req.body || {}
    if (checkEmpty(email, username, step))
        return res.status(400).json({ status: false, message: 'Invalid parameters' })

    if (step === 'send' || step === null) {
        const bindResult = await bindWithNewAccount('send', email, username)
        if (!bindResult.status)
            return res.status(400).json({
                status: false,
                message: bindResult.message || 'Failed to bind account'
            })
        return res.status(200).json({ status: true, message: 'Verification code sent' })
    }
    const { password, code } = req.body || {}
    if (checkEmpty(email, username, password, code, step))
        return res.status(400).json({ status: false, message: 'Invalid parameters' })

    const verifyResult = await bindWithNewAccount('create', email, username, password, code)
    if (!verifyResult.status || !verifyResult.data?.user_id)
        return res.status(400).json({
            status: false,
            message: verifyResult.message || 'Failed to create account'
        })

    const createPlayerResult = await createPlayer(puuid, username, verifyResult.data.user_id, true)
    if (!createPlayerResult.status)
        return res.status(400).json({
            status: false,
            message: createPlayerResult.message || 'Error when creating player'
        })

    return res.status(200).json({
        status: true,
        message: 'Player created successfully'
    })
}

export default bindRouter
