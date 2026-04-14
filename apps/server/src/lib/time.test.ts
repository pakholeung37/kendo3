import { describe, expect, it } from 'vitest'

import { computeNextPollIntervalMinutes, parseFeedTtl } from './time'

describe('parseFeedTtl', () => {
    it('clamps feed ttl to the supported bounds', () => {
        expect(parseFeedTtl('1')).toBe(5)
        expect(parseFeedTtl('900')).toBe(360)
    })
})

describe('computeNextPollIntervalMinutes', () => {
    it('speeds up when new items are found', () => {
        expect(computeNextPollIntervalMinutes({ currentIntervalMin: 15, status: 'success', newCount: 3 })).toBe(11)
    })

    it('backs off on errors', () => {
        expect(computeNextPollIntervalMinutes({ currentIntervalMin: 15, status: 'error' })).toBe(30)
    })

    it('honors ttl hints on successful fetches', () => {
        expect(computeNextPollIntervalMinutes({ currentIntervalMin: 15, status: 'success', ttlHintMin: 45 })).toBe(45)
    })
})
