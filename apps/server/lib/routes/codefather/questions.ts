import type { Route } from '@/types'
import ofetch from '@/utils/ofetch'
import { parseDate } from '@/utils/parse-date'

export const route: Route = {
    path: '/questions/:sort?',
    categories: ['programming'],
    example: '/codefather/questions',
    parameters: {
        sort: '排序方式，可选 `new`（最新）、`hot`（热门），默认为 `new`',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.codefather.cn/qa', 'www.codefather.cn'],
            target: '/questions',
        },
    ],
    name: '问答',
    maintainers: ['JackyST0'],
    handler,
    description: '获取编程导航社区的问答内容，支持按最新、热门排序。',
}

async function handler(ctx) {
    const sort = ctx.req.param('sort') || 'new'

    const sortConfig = sort === 'hot' ? { field: 'favourNum', name: '热门' } : { field: 'createTime', name: '最新' }

    const response = await ofetch('https://api.codefather.cn/api/qa/list/page/vo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: {
            current: 1,
            pageSize: 20,
            sortField: sortConfig.field,
            sortOrder: 'descend',
        },
    })

    if (response.code !== 0) {
        throw new Error(`API error: ${response.message}`)
    }

    const records = response.data?.records || []

    const items = records.map((item: Record<string, unknown>) => {
        const title = (item.title as string) || '无标题'
        const content = (item.content as string) || ''
        const user = (item.user as Record<string, unknown>) || {}
        const tags = (item.tags as string[]) || []
        const bestComment = item.bestComment as Record<string, unknown> | undefined

        // Build description content
        let description = `<div>${content.replaceAll('\n', '<br>')}</div>`

        // Add best answer
        if (bestComment) {
            const answerUser = (bestComment.user as Record<string, unknown>) || {}
            description += '<hr><h4>💡 最佳回答</h4>'
            description += `<p><strong>${answerUser.userName || '匿名'}</strong>：</p>`
            description += `<p>${(bestComment.plainTextDescription as string) || ''}</p>`
        }

        return {
            title,
            link: `https://www.codefather.cn/qa/${item.id}`,
            description,
            pubDate: parseDate(item.createTime as number),
            author: user.userName as string,
            category: tags,
            upvotes: item.thumbNum as number,
            comments: item.commentNum as number,
        }
    })

    return {
        title: `编程导航 - ${sortConfig.name}问答`,
        link: 'https://www.codefather.cn/qa',
        description: `编程导航社区${sortConfig.name}问答`,
        item: items,
    }
}
