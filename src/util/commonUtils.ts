export const isJSON = (data: string | JSON) => {
    try {
        const json = JSON.parse(data as string)
        const type = typeof json
        const isValid = json !== null && type === 'object'
        return { status: isValid, data: json }
    } catch {
        return { status: false }
    }
}

export const isExpired = (expire_at: number) => {
    const now = Date.now()

    return {
        status: now > expire_at
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkEmpty = (...args: any[]): { status: boolean } => {
    const hasInvalid = args.some((arg) => arg === null || arg === undefined || arg === '')
    if (hasInvalid) {
        return { status: true }
    }
    return { status: false }
}

export const isValidEmail = (email: string): { status: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { status: false, message: 'Invalid email format' }
    }
    return { status: true }
}
