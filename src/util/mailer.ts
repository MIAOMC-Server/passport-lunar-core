import type { MailConfig, MailOptions } from '@templates/email/types'
import { appConfig } from '@util/getConfig.js'
import { logger } from '@util/logger'
import nodemailer, { type Transporter } from 'nodemailer'

class Mailer {
    private transporter: Transporter | null = null
    private config: MailConfig

    constructor() {
        this.config = this.loadConfig()
        this.initializeTransporter()
    }

    /**
     * 加载邮件配置
     */
    private loadConfig(): MailConfig {
        return {
            host: (appConfig('MAIL_HOST', 'string') as string) || 'localhost',
            port: (appConfig('MAIL_PORT', 'number') as number) || 587,
            secure: (appConfig('MAIL_SECURE', 'boolean') as boolean) || false,
            auth: {
                user: (appConfig('MAIL_USER', 'string') as string) || '',
                pass: (appConfig('MAIL_PASSWORD', 'string') as string) || ''
            },
            from: (appConfig('MAIL_FROM', 'string') as string) || ''
        }
    }

    /**
     * 初始化邮件传输器
     */
    private initializeTransporter(): void {
        try {
            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: this.config.auth,
                tls: {
                    rejectUnauthorized: !(appConfig('MAIL_TLS', 'boolean') as boolean)
                }
            })
        } catch (error) {
            logger.error('service/MailService', 'Failed to initialize mail transporter:', error)
            process.exit(1)
        }
    }

    /**
     * 验证邮件服务配置
     */
    async verifyConnection(): Promise<boolean> {
        if (!this.transporter) {
            return false
        }

        try {
            await this.transporter.verify()
            return true
        } catch (error) {
            logger.error(
                'service/MailService',
                'Mail service connection verification failed:',
                error
            )
            return false
        }
    }

    /**
     * 发送邮件
     */
    async send(options: MailOptions): Promise<boolean> {
        if (!this.transporter) {
            throw new Error('邮件传输器未初始化')
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.config.from,
                to: options.to,
                subject: options.subject,
                html: options.html
            })

            logger.info('service/MailService', 'Email sent successfully:', info.messageId)
            return true
        } catch (error) {
            logger.error('service/MailService', 'Failed to send email:', error)
            return false
        }
    }

    /**
     * 重新加载配置并重新初始化传输器
     */
    reloadConfig(): void {
        this.config = this.loadConfig()
        this.initializeTransporter()
    }

    /**
     * 获取当前配置（用于调试）
     */
    getConfig(): Omit<MailConfig, 'auth'> {
        return {
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            from: this.config.from
        }
    }
}

// 创建单例实例
export const mailer = new Mailer()
