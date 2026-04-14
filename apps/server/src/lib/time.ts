export const MIN_POLL_INTERVAL_MINUTES = 5
export const DEFAULT_POLL_INTERVAL_MINUTES = 15
export const MAX_POLL_INTERVAL_MINUTES = 360

const isValidNumber = (value: number) => Number.isFinite(value) && value > 0

export const clampIntervalMinutes = (value: number) => {
    if (!isValidNumber(value)) {
        return DEFAULT_POLL_INTERVAL_MINUTES
    }

    return Math.max(MIN_POLL_INTERVAL_MINUTES, Math.min(MAX_POLL_INTERVAL_MINUTES, Math.round(value)))
}

export const parseFeedTtl = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) {
        return null
    }

    const parsed = Number(value)

    if (!isValidNumber(parsed)) {
        return null
    }

    return clampIntervalMinutes(parsed)
}

interface ComputeNextPollIntervalOptions {
    currentIntervalMin: number
    status: 'success' | 'unchanged' | 'error'
    ttlHintMin?: number | null
    newCount?: number
}

export const computeNextPollIntervalMinutes = ({
    currentIntervalMin,
    status,
    ttlHintMin = null,
    newCount = 0,
}: ComputeNextPollIntervalOptions) => {
    const current = clampIntervalMinutes(currentIntervalMin)

    if (status === 'error') {
        return clampIntervalMinutes(Math.max(30, current * 2))
    }

    if (ttlHintMin !== null) {
        return clampIntervalMinutes(ttlHintMin)
    }

    if (newCount > 0) {
        return clampIntervalMinutes(Math.max(MIN_POLL_INTERVAL_MINUTES, current * 0.7))
    }

    return clampIntervalMinutes(current * 1.5)
}
