import { createBrowserRouter } from 'react-router'

import { Component as App } from './App'

export const router = createBrowserRouter([
    {
        path: '/',
        Component: App,
    },
])
