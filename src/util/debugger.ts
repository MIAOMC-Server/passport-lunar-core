import { appConfig } from '@util/getConfig'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Debugger = (...args: any[]) => {
    if (appConfig('DEBUG', 'boolean')) {
        console.log(...args)
    }
}
