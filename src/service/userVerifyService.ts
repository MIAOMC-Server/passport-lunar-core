import { getVerifierToken } from '@service/verifierTokenService'
import { isExpired } from '@util/commonUtils'
import { appConfig } from '@util/getConfig'
import { verifierDecryptor } from '@util/verifierDecryptor'
import crypto from 'crypto'

export interface VerifierServiceResponse {
    status: boolean
    message?: string
    data?: {
        player_uuid: string
        action: string
    }
}

export const verifierService = async (
    rawData: string,
    rawHash: string
): Promise<VerifierServiceResponse> => {
    try {
        const result = await verifierDecryptor.Decryptor(rawData)

        if (!result.status) {
            return { status: false, message: result.message || 'Decryption failed' }
        }

        if (
            !result.data ||
            !result.data.plainBase64 ||
            !result.data.plainJSON ||
            !result.data.plainJSON.token_uuid ||
            !result.data.plainJSON.player_uuid ||
            !result.data.plainJSON.action ||
            !result.data.plainJSON.expire_at
        ) {
            return { status: false, message: 'Decryption result is incomplete' }
        }

        const plainBase64 = result.data.plainBase64
        const plainJSON = result.data.plainJSON

        const remoteToken = await getVerifierToken(plainJSON.token_uuid)

        if (!remoteToken.status || !remoteToken.data || !remoteToken.data.token) {
            return {
                status: false,
                message: remoteToken.message || 'Failed to fetch verifier token'
            }
        }

        const remoteData = remoteToken.data

        if (isExpired(Number(remoteData.expire_at)).status || !remoteData.token) {
            return { status: false, message: 'Verifier token has expired' }
        }

        const hashAlgorithm = 'sha256'
        const salt = appConfig('VERIFIER_SALT', 'string')
        const dataToHash = `${plainBase64}${remoteData.token}${salt}`

        const calculatedHash = crypto
            .createHash(hashAlgorithm)
            .update(dataToHash, 'utf8')
            .digest('hex')

        if (calculatedHash !== rawHash) {
            return { status: false, message: 'Hash verification failed' }
        }

        return {
            status: true,
            data: {
                player_uuid: plainJSON.player_uuid,
                action: plainJSON.action
            }
        }
    } catch (error) {
        console.error('Error in verifierService:', error)
        return { status: false, message: 'Internal server error' }
    }
}
