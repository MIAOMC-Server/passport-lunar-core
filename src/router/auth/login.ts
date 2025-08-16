import { registerUser, verifyUserPasswd } from '@service/authService'
import { genIntrospectToken } from '@service/tokenService'
import { appConfig } from '@util/getConfig'
import express from 'express'

const loginRouter = express.Router()

loginRouter.post('/login', async (req, res) => {
    let processLoginWithEmail = false

    const { username, password } = req.body ?? {}

    if (!username || !password) {
        return res.status(400).json({ status: false, message: 'Invalid username or password' })
    }

    if (username.includes('@')) {
        processLoginWithEmail = true
    }
    // 验证用户密码 (AuthService:verifyUserPasswd)
    const passwdValid = await verifyUserPasswd(
        username,
        password,
        processLoginWithEmail ? 'email' : 'username'
    )

    if (!passwdValid.status || !passwdValid.data?.user_id) {
        return res.status(401).json({ status: false, message: passwdValid.message })
    }
    // 生成访问令牌 (TokenService:genIntrospectToken)
    const introspectToken = await genIntrospectToken(passwdValid.data.user_id)

    return res.status(200).json({
        status: true,
        data: {
            user_id: passwdValid.data.user_id,
            itoken: introspectToken.data
        }
    })
})

loginRouter.post('/register', async (req, res) => {
    if (!appConfig('USER_ALLOW_REGISTER', 'boolean')) {
        return res.status(403).json({
            status: false,
            is_closed: true,
            message: 'Registration is currently closed by administrator'
        })
    }

    const { email, username, password } = req.body ?? {}
    if (!email || !username || !password) {
        return res
            .status(400)
            .json({ status: false, message: 'Invalid email, username or password' })
    }

    //  创建新用户 (AuthService:createUser)
    const result = await registerUser(email, username, password)
    if (!result.status || !result.data) {
        return res.status(500).json({ status: false, message: result.message })
    }

    return res.status(201).json({
        status: true,
        data: {
            user_id: result.data.user_id
        }
    })
})

export default loginRouter
