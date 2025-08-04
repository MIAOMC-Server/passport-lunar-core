# 邮件服务使用说明

本项目包含了一个完整的邮件服务系统，支持类型安全的模板邮件发送。

## 架构说明

- `utils/mailer.ts` - 底层邮件发送逻辑，负责与 nodemailer 交互
- `service/mailService.ts` - 业务层邮件服务，负责模板处理和业务逻辑
- `templates/email/` - 邮件模板文件夹
- `templates/email/types.ts` - 邮件模板的 TypeScript 类型定义

## 配置

在 `.env` 文件中添加以下配置：

```env
# 邮件服务配置
APP_MAIL_HOST=smtp.example.com
APP_MAIL_PORT=465
APP_MAIL_SECURE=true
APP_MAIL_TLS=false

APP_MAIL_USER=your_email@example.com
APP_MAIL_PASSWORD=your_email_password
APP_MAIL_FROM=your_email@example.com

# 服务名称（用于邮件模板）
APP_SERVICE_NAME=MIAOMC Passport

# 前端 URL（用于密码重置链接等）
APP_FRONTEND_URL=http://localhost:3000
```

## 使用方法

### 1. 基本使用 - sendMail 函数

```typescript
import { sendMail } from '../service/mailService.js'

// 发送验证码邮件
await sendMail('user@example.com', 'verificationCode', {
    serviceName: 'MIAOMC Passport',
    currentYear: 2024,
    username: 'John Doe',
    verificationCode: '123456',
    expirationMinutes: 15
})

// 发送密码重置邮件
await sendMail('user@example.com', 'passwordReset', {
    serviceName: 'MIAOMC Passport',
    currentYear: 2024,
    username: 'John Doe',
    resetLink: 'https://example.com/reset-password?token=abc123',
    expirationHours: 24
})

// 发送通知邮件
await sendMail('user@example.com', 'notification', {
    serviceName: 'MIAOMC Passport',
    currentYear: 2024,
    title: '账户安全提醒',
    greeting: '亲爱的用户',
    notificationTitle: '登录异常',
    message: '我们检测到您的账户有异常登录行为',
    actionRequired: true,
    actionDescription: '请及时修改密码',
    additionalInfo: '如有疑问请联系客服'
})
```

### 2. 便捷方法

```typescript
import {
    sendVerificationCode,
    sendPasswordReset,
    sendNotification
} from '../service/mailService.js'

// 发送验证码
await sendVerificationCode(
    'user@example.com',
    'John Doe',
    '123456',
    15 // 过期时间（分钟）
)

// 发送密码重置
await sendPasswordReset(
    'user@example.com',
    'John Doe',
    'https://example.com/reset-password?token=abc123',
    24 // 过期时间（小时）
)

// 发送通知
await sendNotification(
    'user@example.com',
    '账户安全提醒',
    '亲爱的用户',
    '登录异常',
    '我们检测到您的账户有异常登录行为',
    {
        actionRequired: true,
        actionDescription: '请及时修改密码'
    }
)
```

## 类型安全

该邮件服务支持完整的 TypeScript 类型检查：

```typescript
// ✅ 正确的类型
sendMail('user@example.com', 'verificationCode', {
    serviceName: 'MIAOMC Passport',
    currentYear: 2024,
    username: 'John Doe',
    verificationCode: '123456',
    expirationMinutes: 15
})

// ❌ 类型错误 - 缺少必需字段
sendMail('user@example.com', 'verificationCode', {
    username: 'John Doe'
    // 缺少其他必需字段，TypeScript 会报错
})

// ❌ 类型错误 - 字段类型不匹配
sendMail('user@example.com', 'verificationCode', {
    serviceName: 'MIAOMC Passport',
    currentYear: 2024,
    username: 'John Doe',
    verificationCode: 123456, // 应该是 string 类型
    expirationMinutes: '15' // 应该是 number 类型
})
```

## 添加新的邮件模板

### 1. 创建 HTML 模板文件

在 `src/templates/email/` 目录下创建新的 HTML 文件，例如 `welcome.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8" />
        <title>欢迎</title>
    </head>
    <body>
        <h1>欢迎 {{username}} 加入 {{serviceName}}！</h1>
        <p>您的账户已成功创建。</p>
    </body>
</html>
```

### 2. 更新类型定义

在 `src/templates/email/types.ts` 中添加新的模板类型：

```typescript
// 欢迎邮件模板数据
export interface WelcomeTemplateData extends BaseTemplateData {
    username: string
}

// 更新模板映射类型
export interface TemplateDataMap {
    verificationCode: VerificationCodeTemplateData
    passwordReset: PasswordResetTemplateData
    notification: NotificationTemplateData
    welcome: WelcomeTemplateData // 新增
}
```

### 3. 使用新模板

```typescript
await sendMail('user@example.com', 'welcome', {
    serviceName: 'MIAOMC Passport',
    currentYear: 2024,
    username: 'John Doe'
})
```

## 模板占位符语法

支持以下占位符语法：

- `{{variable}}` - 简单变量替换
- `{{#if condition}} ... {{/if}}` - 条件显示

## 错误处理

所有邮件发送方法都返回 `Promise<boolean>`：

```typescript
const success = await sendMail('user@example.com', 'verificationCode', data)

if (success) {
    console.log('邮件发送成功')
} else {
    console.log('邮件发送失败')
}
```

## 调试和测试

```typescript
import { mailService } from '../service/mailService.js'

// 验证邮件服务连接
const isConnected = await mailService.verifyConnection()
console.log('邮件服务连接状态:', isConnected)

// 清理模板缓存（开发时有用）
mailService.clearTemplateCache()
```
