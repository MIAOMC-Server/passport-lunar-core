import { verifyBindToken } from '@service/tokenService'
import { NextFunction, Request, Response } from 'express'

interface BindTokenMiddlewareReturn {
    name: string
    status: boolean
    has_token: boolean
    message?: string
    data?: object
}

export const bindTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const bindToken = req.headers['x-miaomc-bind-token'] as string | undefined

    const result: BindTokenMiddlewareReturn = {
        name: 'bindTokenMiddleware',
        status: false,
        has_token: false,
        message: 'Invalid authorization token'
    }

    if (bindToken?.startsWith('BT_')) {
        result.has_token = true
        const verifiedToken = await verifyBindToken(bindToken)

        if (verifiedToken.status && verifiedToken.data) {
            result.status = true
            result.data = verifiedToken.data
            delete result.message
        } else {
            result.message = 'Failed to verify authorization token'
        }
    }

    res.locals.middleware = result
    next()
}
