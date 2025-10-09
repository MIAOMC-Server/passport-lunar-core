import type { TemplateDataMap, TemplateName } from '@templates/email/types'
import { appConfig } from '@util/getConfig'
import { logger } from '@util/logger'
import { mailer } from '@util/mailer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 邮件服务返回接口
interface MailServiceReturn {
    status: boolean
    message?: string
    data?: {
        sent: boolean
        recipient: string
        template?: string
    }
}

interface MailConnectionReturn {
    status: boolean
    message?: string
    data?: {
        connected: boolean
    }
}

class MailService {
    private templateCache: Map<string, string> = new Map()

    /**
     * 加载邮件模板
     */
    private async loadTemplate(templateName: string): Promise<string> {
        // 检查缓存
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!
        }

        try {
            const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`)
            const template = await fs.readFile(templatePath, 'utf-8')

            // 缓存模板
            this.templateCache.set(templateName, template)
            return template
        } catch (error) {
            logger.error('service/MailService', `Failed to load template ${templateName}:`, error)
            logger.critical(
                'service/MailService',
                `Failed to load template ${templateName}:`,
                error
            )
            process.exit(1)
        }
    }

    /**
     * 替换模板中的占位符
     */
    private replaceTemplatePlaceholders(template: string, data: Record<string, unknown>): string {
        let result = template

        // 处理简单的 {{key}} 占位符
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
            result = result.replace(regex, String(value ?? ''))
        }

        // 处理条件语句 {{#if condition}} ... {{/if}}
        const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g
        result = result.replace(ifRegex, (match, condition, content) => {
            return data[condition] ? content : ''
        })

        // 清理未匹配的占位符
        result = result.replace(/{{\s*[\w.]+\s*}}/g, '')

        return result
    }

    /**
     * 获取默认的基础数据
     */
    private getBaseTemplateData() {
        return {
            serviceName: appConfig('SERVICE_NAME', 'string', 'MIAOMC Passport'),
            currentYear: new Date().getFullYear()
        }
    }

    /**
     * 发送邮件的公共方法 - 带类型约束
     */
    async sendMail<T extends TemplateName>(
        email: string,
        templateName: T,
        data: TemplateDataMap[T],
        subject?: string
    ): Promise<MailServiceReturn> {
        try {
            // 加载模板
            const template = await this.loadTemplate(templateName)

            // 合并基础数据和传入数据
            const templateData = {
                ...this.getBaseTemplateData(),
                ...data
            }

            // 替换占位符
            const html = this.replaceTemplatePlaceholders(
                template,
                templateData as unknown as Record<string, unknown>
            )

            // 根据模板类型设置默认主题
            let defaultSubject: string
            switch (templateName) {
                case 'verificationCode':
                    defaultSubject = '邮箱验证码'
                    break
                case 'passwordReset':
                    defaultSubject = '密码重置请求'
                    break
                case 'notification':
                    defaultSubject = (data as TemplateDataMap['notification']).title || '系统通知'
                    break
                default:
                    defaultSubject = '系统邮件'
            }

            // 发送邮件
            const result = await mailer.send({
                to: email,
                subject: subject || defaultSubject,
                html
            })

            if (result) {
                return {
                    status: true,
                    data: {
                        sent: true,
                        recipient: email,
                        template: templateName
                    }
                }
            } else {
                return {
                    status: false,
                    message: `Failed to send ${templateName} email to ${email}`,
                    data: {
                        sent: false,
                        recipient: email,
                        template: templateName
                    }
                }
            }
        } catch (error) {
            logger.error(
                'service/MailService',
                `Failed to send ${templateName} email to ${email}:`,
                error
            )
            return {
                status: false,
                message:
                    error instanceof Error ? error.message : `Failed to send ${templateName} email`,
                data: {
                    sent: false,
                    recipient: email,
                    template: templateName
                }
            }
        }
    }

    /**
     * 发送验证码邮件
     */
    async sendVerificationCode(
        email: string,
        username: string = '用户',
        verificationCode: string,
        expirationMinutes: number = 15
    ): Promise<MailServiceReturn> {
        return this.sendMail(email, 'verificationCode', {
            serviceName: appConfig('SERVICE_NAME', 'string', 'MIAOMC Passport') as string,
            currentYear: new Date().getFullYear(),
            username,
            verificationCode,
            expirationMinutes
        })
    }

    /**
     * 发送密码重置邮件
     */
    async sendPasswordReset(
        email: string,
        username: string,
        resetLink: string,
        expirationHours: number = 24
    ): Promise<MailServiceReturn> {
        return this.sendMail(email, 'passwordReset', {
            serviceName: appConfig('SERVICE_NAME', 'string', 'MIAOMC Passport') as string,
            currentYear: new Date().getFullYear(),
            username,
            resetLink,
            expirationHours
        })
    }

    /**
     * 发送通知邮件
     */
    async sendNotification(
        email: string,
        title: string,
        greeting: string,
        notificationTitle: string,
        message: string,
        options?: {
            actionRequired?: boolean
            actionDescription?: string
            additionalInfo?: string
        }
    ): Promise<MailServiceReturn> {
        return this.sendMail(email, 'notification', {
            serviceName: appConfig('SERVICE_NAME', 'string', 'MIAOMC Passport') as string,
            currentYear: new Date().getFullYear(),
            title,
            greeting,
            notificationTitle,
            message,
            ...options
        })
    }

    /**
     * 清理模板缓存
     */
    clearTemplateCache(): void {
        this.templateCache.clear()
    }

    /**
     * 验证邮件服务连接
     */
    async verifyConnection(): Promise<MailConnectionReturn> {
        try {
            const result = await mailer.verifyConnection()

            if (result) {
                return {
                    status: true,
                    data: {
                        connected: true
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'Failed to connect to mail service',
                    data: {
                        connected: false
                    }
                }
            }
        } catch (error) {
            logger.error('service/MailService', 'Mail service connection error:', error)
            return {
                status: false,
                message: error instanceof Error ? error.message : 'Mail service connection failed',
                data: {
                    connected: false
                }
            }
        }
    }
}

// 创建单例实例
const mailService = new MailService()

// 导出发送邮件函数
export const sendMail = mailService.sendMail.bind(mailService)

// 导出便捷方法
export const sendVerificationCode = mailService.sendVerificationCode.bind(mailService)
export const sendPasswordReset = mailService.sendPasswordReset.bind(mailService)
export const sendNotification = mailService.sendNotification.bind(mailService)

// 导出邮件服务实例（用于高级操作）
export { mailService }
