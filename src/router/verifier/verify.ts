import { isPlayerBinded } from '@repo/playerRepo'
import { processPlayerNext } from '@service/playerService'
import { genBindToken } from '@service/tokenService'
import { verifierService } from '@service/userVerifyService'
import { appConfig } from '@util/getConfig'
import express from 'express'

const verifierRouter = express.Router()

interface VerifyRouterResponse {
    status: boolean
    message?: string
    next?: string
    data?: object
}
verifierRouter.get('/verify', async (req, res) => {
    try {
        const { data, hash } = req.query

        if (!data || !hash) {
            return res.status(400).json({
                status: false,
                message: 'Missing data or hash'
            } as VerifyRouterResponse)
        }

        //解密
        const verifyResult = await verifierService(data as string, hash as string)
        if (!verifyResult.status || !verifyResult.data) {
            return res.status(400).json({
                status: false,
                message: verifyResult.message || 'Verification failed'
            } as VerifyRouterResponse)
        }

        //检查玩家是否绑定
        const isBinded = await isPlayerBinded(verifyResult.data.player_uuid)
        if (!isBinded.status) {
            return res.status(400).json({
                status: false,
                message: 'Error when processing player binding'
            } as VerifyRouterResponse)
        }

        //处理该玩家的方式
        const process = await processPlayerNext(verifyResult.data.player_uuid)
        if (!process.status) {
            return res.status(400).json({
                status: false,
                message: process.message || 'Error when processing player'
            } as VerifyRouterResponse)
        }

        switch (process.next) {
            case 'Bind': {
                //处理待绑定玩家
                const bindData = { player_uuid: verifyResult.data.player_uuid }

                const bindToken = await genBindToken(bindData)
                if (!bindToken.status || !bindToken.data || !bindToken.data.token) {
                    return res.status(400).json({
                        status: false,
                        message: bindToken.message || 'Error when generating bind token'
                    } as VerifyRouterResponse)
                }

                return res.status(200).json({
                    status: true,
                    data: {
                        bind_token: bindToken.data.token
                    },
                    next: 'Bind'
                })
            }
            case 'Login':
                // Handle login case
                break
            case 'Create':
                // Handle create case
                break
            case 'Failed':
                // Handle failed case
                break
            case 'Select':
                // Handle select case
                break
        }
    } catch (error) {
        if (appConfig('APP_DEBUG', 'boolean')) {
            return res.status(400).json({ status: false, message: 'Verification failed: ' + error })
        }

        return res.status(400).json({ status: false, message: 'Verification failed' })
    }
})

export default verifierRouter
