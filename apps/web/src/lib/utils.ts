import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const shortDateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
})

const fullDateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatDateTime = (value: number | null | undefined) => {
    if (!value) {
        return '暂无'
    }

    return shortDateTimeFormatter.format(value)
}

export const formatDateTimeFull = (value: number | null | undefined) => {
    if (!value) {
        return '暂无'
    }

    return fullDateTimeFormatter.format(value)
}

export const formatTimeOnly = (value: number | null | undefined) => {
    if (!value) {
        return '--:--'
    }

    return timeFormatter.format(value)
}

export const formatRelativeMinutes = (minutes: number) => `${minutes} 分钟`

export const formatCompactNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value)
