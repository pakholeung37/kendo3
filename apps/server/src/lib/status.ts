import type { SourceRow } from '../db/schema'

export type SourceStatus = 'active' | 'error' | 'disabled'

export const deriveSourceStatus = (source: Pick<SourceRow, 'enabled' | 'consecutiveFailures' | 'lastErrorAt' | 'lastSuccessAt'>): SourceStatus => {
    if (!source.enabled) {
        return 'disabled'
    }

    if (source.consecutiveFailures > 0 && (!source.lastSuccessAt || (source.lastErrorAt ?? 0) >= source.lastSuccessAt)) {
        return 'error'
    }

    return 'active'
}
