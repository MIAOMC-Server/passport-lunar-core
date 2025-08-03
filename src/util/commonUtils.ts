export const isJSON = (data: string | JSON) => {
    try {
        const json = JSON.parse(data as string)
        return { status: true, data: json }
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
