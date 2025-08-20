import { introspectMiddleware } from '@middleware/authMid'
import express from 'express'

const introspectRouter = express.Router()

introspectRouter.use(introspectMiddleware)

introspectRouter.post('/introspect', async (_, res) => {
    const middlewareRes = res.locals.middleware

    if (!middlewareRes) {
        res.status(400).json({
            status: false,
            message: middlewareRes.message || 'No valid token provided'
        })
        return
    }

    if (!middlewareRes.status) {
        res.status(401).json({
            status: false,
            message: middlewareRes.message || 'Token is invalid'
        })
        return
    }

    if (middlewareRes.status && middlewareRes.data) {
        return res.status(200).json({
            status: true,
            data: { ...middlewareRes.data, is_renewed: middlewareRes.is_renewed }
        })
        return
    }

    return res.status(500).json({
        status: false,
        message: 'Internal server error'
    })
})

export default introspectRouter
