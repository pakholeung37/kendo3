import * as React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import './styles/index.css'
import { router } from './router'

const rootElement = document.querySelector('#root')

if (!rootElement) {
    throw new Error('Missing #root element')
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
