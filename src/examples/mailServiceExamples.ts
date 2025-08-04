/**
 * 邮件服务使用示例
 *
 * 展示如何在实际业务中使用邮件服务
 */

import {
    sendMail,
    sendNotification,
    sendPasswordReset,
    sendVerificationCode
} from '@service/mailService.js'

/**
 * 用户注册后发送验证码示例
 */
export async function handleUserRegistration(email: string, username: string) {
    // 生成6位数验证码
    const verificationCode = Math.random().toString().slice(2, 8)

    const success = await sendVerificationCode(
        email,
        username,
        verificationCode,
        15 // 15分钟后过期
    )

    if (success) {
        console.log(`验证码邮件已发送到 ${email}`)
        return { success: true, code: verificationCode }
    } else {
        console.error(`验证码邮件发送失败: ${email}`)
        return { success: false, error: '邮件发送失败' }
    }
}

/**
 * 用户忘记密码时发送重置邮件示例
 */
export async function handlePasswordResetRequest(
    email: string,
    username: string,
    resetToken: string
) {
    const frontendUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

    const success = await sendPasswordReset(
        email,
        username,
        resetLink,
        24 // 24小时后过期
    )

    if (success) {
        console.log(`密码重置邮件已发送到 ${email}`)
        return { success: true }
    } else {
        console.error(`密码重置邮件发送失败: ${email}`)
        return { success: false, error: '邮件发送失败' }
    }
}

/**
 * 发送安全通知示例
 */
export async function handleSecurityAlert(
    email: string,
    username: string,
    ipAddress: string,
    location: string
) {
    const success = await sendNotification(
        email,
        '账户安全提醒',
        `亲爱的 ${username}`,
        '检测到异常登录',
        `我们检测到您的账户在 ${location} (IP: ${ipAddress}) 有登录行为。如果这不是您本人操作，请立即采取安全措施。`,
        {
            actionRequired: true,
            actionDescription: '建议立即修改密码并检查账户安全设置',
            additionalInfo: '如有疑问，请联系我们的客服团队'
        }
    )

    return { success }
}

/**
 * 使用通用 sendMail 方法的自定义邮件示例
 */
export async function sendCustomVerificationEmail(email: string, username: string, code: string) {
    const success = await sendMail(
        email,
        'verificationCode',
        {
            serviceName: 'MIAOMC Passport',
            currentYear: new Date().getFullYear(),
            username,
            verificationCode: code,
            expirationMinutes: 30 // 自定义30分钟过期
        },
        '【MIAOMC】请验证您的邮箱地址'
    ) // 自定义邮件主题

    return { success }
}

/**
 * 批量发送邮件示例
 */
export async function sendBulkNotifications(
    users: Array<{ email: string; username: string }>,
    message: string
) {
    const results = []

    for (const user of users) {
        const success = await sendNotification(
            user.email,
            '系统公告',
            `亲爱的 ${user.username}`,
            '重要通知',
            message
        )

        results.push({
            email: user.email,
            success
        })

        // 添加延迟避免邮件服务器限制
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
}
