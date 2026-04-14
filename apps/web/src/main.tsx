import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { ThemeProvider } from '@/components/theme-provider'
import './styles/index.css'
import { router } from './router'

const rootElement = document.querySelector('#root')

if (!rootElement) {
    throw new Error('Missing #root element')
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 10_000,
        },
    },
})

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
