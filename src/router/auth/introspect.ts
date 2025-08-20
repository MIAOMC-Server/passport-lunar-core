import { verifyIntrospectToken } from '@service/tokenService'
import express from 'express'

const introspectRouter = express.Router()

introspectRouter.post('/introspect', async (req, res) => {
    if (!req.body || !req.body.token) {
        return res.status(400).json({ status: false, message: 'No token provided' })
    }

    const token = req.body.token

    const result = await verifyIntrospectToken(token)
    if (!result.status || !result.data) {
        return res.status(400).json({
            status: false,
            message: result.message || 'Error when verify introspect token'
        })
    }

    return res.status(200).json({
        status: true,
        data: result.data
    })
})

export default introspectRouter
