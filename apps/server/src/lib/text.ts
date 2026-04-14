import { convert } from 'html-to-text'

const SUMMARY_MAX_LENGTH = 240
export const SOURCE_ID_MAX_LENGTH = 64
const LEGACY_UUID_SOURCE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LEGACY_HEX_SOURCE_ID_RE = /^[0-9a-f]{32,}$/i

const toPlainText = (value: string) => {
    const normalized = value.replace(/\s+/g, ' ').trim()

    if (!normalized) {
        return ''
    }

    const plainText = /<[^>]+>/.test(normalized)
        ? convert(normalized, {
              wordwrap: false,
              selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }],
          })
        : normalized

    return plainText.replace(/\s+/g, ' ').trim()
}

export const extractSummary = (...candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
        if (!candidate) {
            continue
        }

        const plainText = toPlainText(candidate)

        if (!plainText) {
            continue
        }

        if (plainText.length <= SUMMARY_MAX_LENGTH) {
            return plainText
        }

        return `${plainText.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`
    }

    return ''
}

export const deriveSourceName = (endpoint: string) => {
    try {
        const url = new URL(endpoint)
        return url.hostname
    } catch {
        return endpoint
    }
}

export const normalizeSourceId = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, SOURCE_ID_MAX_LENGTH)
        .replace(/-+$/g, '')

export const deriveSourceId = (...candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
        if (!candidate) {
            continue
        }

        const normalized = normalizeSourceId(candidate)

        if (normalized) {
            return normalized
        }
    }

    return ''
}

export const createUniqueSourceId = (baseId: string, isTaken: (candidate: string) => boolean) => {
    if (!baseId) {
        return ''
    }

    let nextId = baseId
    let suffix = 2

    while (isTaken(nextId)) {
        const suffixLabel = `-${suffix}`
        const trimmedBase = baseId.slice(0, SOURCE_ID_MAX_LENGTH - suffixLabel.length).replace(/-+$/g, '')
        nextId = `${trimmedBase || baseId}${suffixLabel}`
        suffix += 1
    }

    return nextId
}

export const isLegacyGeneratedSourceId = (value: string) => LEGACY_UUID_SOURCE_ID_RE.test(value) || LEGACY_HEX_SOURCE_ID_RE.test(value)
