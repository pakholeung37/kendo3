import { createBrowserRouter } from 'react-router'

import { AppLayout } from './App'
import { FeedPage } from './routes/feed-page'
import { RunsPage } from './routes/runs-page'
import { SourcesPage } from './routes/sources-page'

export const router = createBrowserRouter([
    {
        path: '/',
        Component: AppLayout,
        children: [
            {
                index: true,
                Component: FeedPage,
            },
            {
                path: 'sources',
                Component: SourcesPage,
            },
            {
                path: 'runs',
                Component: RunsPage,
            },
        ],
    },
])
