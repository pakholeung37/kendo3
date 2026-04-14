import { strict as assert } from 'node:assert'

const millisInAnHour = 60 * 60 * 1000
const serverTimezone = -new Date().getTimezoneOffset() / 60

export default function timezone(date: string | Date, timezone = serverTimezone) {
    if (typeof date === 'string') {
        date = new Date(date)
    }

    assert.ok(date instanceof Date)

    return new Date(date.getTime() - millisInAnHour * (timezone - serverTimezone))
}
