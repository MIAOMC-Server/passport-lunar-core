import { bindTokenMiddleware } from '@middleware/bindMid'
import express from 'express'

const bindRouter = express.Router()

// 使用中间件
bindRouter.use(bindTokenMiddleware)

// bindRouter.post('/bind', async (req, res) => {})
