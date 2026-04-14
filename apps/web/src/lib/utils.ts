const fullDateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
})

export const formatDateTime = (value: number | null | undefined) => {
    if (!value) {
        return '暂无'
    }

    return fullDateTimeFormatter.format(value)
}

export const formatRelativeMinutes = (minutes: number) => `${minutes} 分钟`

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')
