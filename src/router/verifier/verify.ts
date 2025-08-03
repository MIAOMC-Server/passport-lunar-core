import { verifierService } from '@service/userVerifyService'
import { appConfig } from '@util/getConfig'
import express from 'express'

const verifierRouter = express.Router()

verifierRouter.get('/verify', async (req, res) => {
    try {
        const { data, hash } = req.query

        if (!data || !hash) {
            return res.status(400).json({ status: false, message: 'Missing data or hash' })
        }

        const result = await verifierService(data as string, hash as string)

        if (!result.status) {
            return res
                .status(400)
                .json({ status: false, message: result.message || 'Verification failed' })
        }

        // const isPlayerBinded = await isPlayerBinded(result.data.player_uuid)

        return res.status(200).send(result)
    } catch (error) {
        if (appConfig('APP_DEBUG', 'boolean')) {
            return res.status(400).json({ status: false, message: 'Verification failed: ' + error })
        }

        return res.status(400).json({ status: false, message: 'Verification failed' })
    }
})

export default verifierRouter
