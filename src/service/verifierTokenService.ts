import { getAPIFullUrl } from '@util/infoAPI'
import { logger } from '@util/logger'
import axios from 'axios'

interface ResponseData {
    tuuid: string
    token: string
    expire_at: string
    create_at: string
}

interface getVerifierTokenResponse {
    status: boolean
    message?: string
    data?: ResponseData
}

export const getVerifierToken = async (tuuid: string): Promise<getVerifierTokenResponse> => {
    try {
        const { fullURL } = getAPIFullUrl('GET', `/token/${tuuid}`)

        const { data } = await axios.get(fullURL)

        if (!data || typeof data !== 'object') {
            return { status: false, message: 'Invalid response format from verifierToken API' }
        }

        if (data.status === true) {
            return { status: true, data: data.data as ResponseData }
        } else {
            return {
                status: false,
                message: data.message || 'Error fetching data(verifierToken)'
            }
        }
    } catch (error) {
        logger.error('service/VerifierTokenService', 'Error fetching data:', error)
        return { status: false, message: 'Error fetching data(verifierToken)' }
    }
}
