import { describe, expect, it } from 'vitest'

import { cn, formatDateTime, formatRelativeMinutes } from './utils'

describe('cn', () => {
    it('joins truthy class names', () => {
        expect(cn('base', false, undefined, 'accent')).toBe('base accent')
    })
})

describe('formatRelativeMinutes', () => {
    it('formats poll interval minutes', () => {
        expect(formatRelativeMinutes(15)).toBe('15 分钟')
    })
})

describe('formatDateTime', () => {
    it('returns fallback for empty values', () => {
        expect(formatDateTime(null)).toBe('暂无')
    })
})
