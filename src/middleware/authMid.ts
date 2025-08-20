import { verifyIntrospectToken } from '@service/tokenService'
import { NextFunction, Request, Response } from 'express'

interface IntrospectMiddlewareReturn {
    name: string
    status: boolean
    has_token: boolean
    message?: string
    data?: object
}

export const introspectMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const introspectToken = req.headers['x-miaomc-introspect-token'] as string | undefined

    const result: IntrospectMiddlewareReturn = {
        name: 'IntrospectMiddleware',
        status: false,
        has_token: false,
        message: 'Invalid authorization token'
    }

    if (introspectToken?.startsWith('IT_')) {
        result.has_token = true
        const verifiedToken = await verifyIntrospectToken(introspectToken)

        if (verifiedToken.status && verifiedToken.data) {
            result.status = true
            result.data = verifiedToken.data
            delete result.message
        } else {
            result.message = 'Failed to verify introspect token'
        }
    }

    res.locals.middleware = result
    if (res.headersSent) return
    return next()
}
