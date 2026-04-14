import { convert } from 'html-to-text'

const SUMMARY_MAX_LENGTH = 240

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
