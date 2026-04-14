import { describe, expect, it } from 'vitest'

import { deriveSourceName, extractSummary } from './text'

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
