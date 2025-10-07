import { bindTokenMiddleware } from '@middleware/bindMid'
import express from 'express'

const bindRouter = express.Router()

// 使用中间件
bindRouter.use(bindTokenMiddleware)

bindRouter.post('/bind', async (req, res) => {
    const middlewareRes = res.locals.middleware
    if (!middlewareRes) {
        return res.status(400).json({
            status: false,
            message: 'Invalid bind token'
        })
    }

    if (!req.body) {
        return res.status(400).json({
            status: false,
            message: 'Missing required fields'
        })
    }
})

export default bindRouter
