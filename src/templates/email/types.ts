// 邮件模板类型定义
export interface BaseTemplateData {
    serviceName: string
    currentYear: number
}

// 验证码模板数据
export interface VerificationCodeTemplateData extends BaseTemplateData {
    username: string
    verificationCode: string
    expirationMinutes: number
}

// 密码重置模板数据
export interface PasswordResetTemplateData extends BaseTemplateData {
    username: string
    resetLink: string
    expirationHours: number
}

// 通知模板数据
export interface NotificationTemplateData extends BaseTemplateData {
    title: string
    greeting: string
    notificationTitle: string
    message: string
    actionRequired?: boolean
    actionDescription?: string
    additionalInfo?: string
}

// 模板映射类型
export interface TemplateDataMap {
    verificationCode: VerificationCodeTemplateData
    passwordReset: PasswordResetTemplateData
    notification: NotificationTemplateData
}

// 模板名称类型
export type TemplateName = keyof TemplateDataMap

// 邮件发送选项
export interface MailOptions {
    to: string
    subject: string
    html: string
}

// 邮件服务配置
export interface MailConfig {
    host: string
    port: number
    secure: boolean
    auth: {
        user: string
        pass: string
    }
    from: string
}
