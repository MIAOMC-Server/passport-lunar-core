import verifierRouter from '@router/verifier/verify'
import express from 'express'

export const appRouter = express.Router()

appRouter.use('/passport/verifier', verifierRouter)
