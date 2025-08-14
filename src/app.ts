import { appRouter } from '@router/index'
import { connTest, redisTest } from '@util/database/index'
import { appConfig } from '@util/getConfig'
import cors from 'cors'
import express from 'express'

// 测试数据库连接
connTest()
redisTest()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('', appRouter)

app.listen(Number(appConfig('PORT', 'number')), () => {
    console.log(`Server started on port ${appConfig('PORT', 'number')}`)
})
