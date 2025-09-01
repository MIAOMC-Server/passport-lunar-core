import { bindTokenMiddleware } from '@middleware/bindMid'
import express from 'express'

const bindRouter = express.Router()

// 使用中间件
bindRouter.use(bindTokenMiddleware)

bindRouter.post('/bind', async (req, res) => {
    const bindMiddleware = res.locals.middleware
    if (!bindMiddleware || !bindMiddleware.status || !bindMiddleware.data) {
        return res.status(401).json({
            status: false,
            message: bindMiddleware?.message || 'Unauthorized'
        })
    }

    const { type, step, puuid } = req.body

    // 验证请求的玩家UUID是否与Token一致
    if (puuid !== (bindMiddleware.data.player_uuid as string)) {
        return res.status(400).json({
            status: false,
            message: 'Player UUID does not match token'
        })
    }

    switch (type) {
        case 'newAccont':
            break
        // 创建新账号并绑定
        case 'bindExist':
            break
        // 绑定已有账号
    }
})

export default bindRouter
