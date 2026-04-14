import { describe, expect, it } from 'vitest'

import { createUniqueSourceId, deriveSourceId, deriveSourceName, extractSummary, isLegacyGeneratedSourceId, normalizeSourceId } from './text'

describe('extractSummary', () => {
    it('prefers the first non-empty candidate and strips html', () => {
        expect(extractSummary('', '<p>Hello <strong>world</strong></p>', 'Fallback')).toBe('Hello world')
    })

    it('falls back to an empty string', () => {
        expect(extractSummary(undefined, null, '')).toBe('')
    })
})

describe('deriveSourceName', () => {
    it('uses hostname when endpoint is a valid url', () => {
        expect(deriveSourceName('https://example.com/feed.xml')).toBe('example.com')
    })
})

describe('normalizeSourceId', () => {
    it('converts text into a lowercase slug', () => {
        expect(normalizeSourceId('  My Feed / Daily  ')).toBe('my-feed-daily')
    })

    it('removes accents and unsupported characters', () => {
        expect(normalizeSourceId('Café 漢字 Feed')).toBe('cafe-feed')
    })
})

describe('deriveSourceId', () => {
    it('uses the first candidate that can produce a slug', () => {
        expect(deriveSourceId('  ', 'My Feed', 'https://example.com/feed.xml')).toBe('my-feed')
    })

    it('falls back to an empty string when no candidate is usable', () => {
        expect(deriveSourceId('漢字', '***')).toBe('')
    })
})

describe('createUniqueSourceId', () => {
    it('adds numeric suffixes when the base id is already taken', () => {
        const takenIds = new Set(['my-feed', 'my-feed-2'])

        expect(createUniqueSourceId('my-feed', (candidate) => takenIds.has(candidate))).toBe('my-feed-3')
    })
})

describe('isLegacyGeneratedSourceId', () => {
    it('treats uuid-like ids as legacy generated ids', () => {
        expect(isLegacyGeneratedSourceId('3f7e42b4-196f-4f3e-893c-ee06b9b31091')).toBe(true)
    })

    it('does not treat readable slugs as legacy ids', () => {
        expect(isLegacyGeneratedSourceId('hacker-news')).toBe(false)
    })
})
