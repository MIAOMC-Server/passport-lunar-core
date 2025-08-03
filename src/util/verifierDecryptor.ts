import { isJSON } from '@util/commonUtils'
import { VerifierPrivateKey } from '@util/getConfig'
import crypto, { createDecipheriv } from 'crypto'

interface AESDecryptorOption {
    algorithm: string
    iv: string
    authTag: string
}

export class VerifierDecryptor {
    private privateKey: string

    constructor() {
        this.privateKey = VerifierPrivateKey
    }

    async Decryptor(rawBase64: string) {
        try {
            // 1.将请求转换成JSON格式
            const step1 = Buffer.from(rawBase64, 'base64').toString('utf-8')
            const encryptedJSON = isJSON(step1)
            if (!encryptedJSON.status) {
                return { status: false, message: 'Decryptor: Faild when processing JSON Parse' }
            }

            const rawJSON = encryptedJSON.data

            // 2.解密密钥(RSA)
            const step2 = this.RSADecrypto(rawJSON.encryptedKey)
            if (!step2.status || !step2.data) {
                return {
                    status: false,
                    message: step2.message || 'Decryptor: Faild when processing RSA decrypt'
                }
            }

            const AESKey = step2.data

            // 2.1 获取必要的AES解密信息
            const iv = rawJSON.iv
            const algorithm = this.getEncryptionAlgorithmByVersion(
                rawJSON.algorithmVersion as number
            )

            const encryptedAESData = rawJSON.encryptedData
            const authTag = rawJSON.authTag

            if (!iv || !algorithm || !encryptedAESData || !authTag) {
                return { status: false, message: 'Decryptor: Missing necessary data' }
            }

            // 3.解密明文(AES)
            const AESDecryptOptions: AESDecryptorOption = {
                algorithm: algorithm,
                iv: iv,
                authTag: authTag
            }

            const step3 = this.AESDecryptor(encryptedAESData, AESKey!, AESDecryptOptions)
            if (!step3.status || !step3.data) {
                return { status: false, message: 'Decryptor: Faild when processing AES decrypt' }
            }

            const decryptedBase64Data = step3.data
            const plainBase64Data = Buffer.from(decryptedBase64Data, 'base64').toString('utf-8')
            const decodedJSON = isJSON(Buffer.from(plainBase64Data, 'base64').toString('utf-8'))

            if (!decodedJSON.status) {
                return { status: false, message: 'Decryptor: Faild when processing JSON Parse' }
            }

            return {
                status: true,
                data: { plainBase64: plainBase64Data, plainJSON: decodedJSON.data }
            }
        } catch (error) {
            console.error('Decryptor error:', error)
            return {
                status: false,
                message: 'Decryptor: Something went wrong, please try again later.'
            }
        }
    }

    RSADecrypto(encryptedData: string) {
        try {
            const decryptedData = crypto.privateDecrypt(
                {
                    key: this.privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                    oaepLabel: Buffer.alloc(0)
                },
                Buffer.from(encryptedData, 'base64')
            )

            if (!decryptedData) {
                return { status: false, message: 'stage-RSADecrypt Missing data' }
            }
            return { status: true, data: decryptedData }
        } catch (error) {
            console.log(error)
            return { status: false, message: 'stage-RSADecrypt Error when decrypting data' }
        }
    }

    AESDecryptor(rawBase64: string, rawKey: Buffer, options: AESDecryptorOption) {
        try {
            const key = rawKey
            const iv = Buffer.from(options.iv, 'base64')
            const authTag = Buffer.from(options.authTag, 'base64')

            const decipher = createDecipheriv(options.algorithm, key, iv) as crypto.DecipherGCM
            if (options.algorithm.includes('gcm')) {
                decipher.setAuthTag(authTag)
            }

            const encryptedData = Buffer.from(rawBase64, 'base64')

            let decryptedData = decipher.update(encryptedData)
            decryptedData = Buffer.concat([decryptedData, decipher.final()])

            return { status: true, data: decryptedData.toString('base64') }
        } catch (error) {
            return {
                status: false,
                message: `Decryptor: AES decryption failed - ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        }
    }

    getEncryptionAlgorithmByVersion(version: number) {
        if (version === 1.0) {
            return 'aes-256-gcm'
        }

        return 'aes-256-gcm'
    }
}

export const verifierDecryptor = new VerifierDecryptor()
