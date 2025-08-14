import crypto from 'crypto'

interface genTokenReturn {
    status: boolean
    data?: {
        token: string
    }
}
export const genToken = async (length: number = 32): Promise<genTokenReturn> => {
    try {
        const token = await crypto.randomBytes(length).toString('hex')
        return { status: true, data: { token } }
    } catch (error) {
        console.log(error)
        return { status: false }
    }
}
