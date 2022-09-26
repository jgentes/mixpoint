import { Outlet, Links, Meta, LiveReload, Scripts } from '@remix-run/react'
import { InitialLoader } from './components/InitialLoader'

// fonts!
import '@fontsource/roboto-mono/400.css'
import '@fontsource/public-sans/300.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/700.css'

export const meta = () => {
  return {
    title: 'Mixpoint',
    description: 'Mixpoint is multi-track audio editor for the modern dj',
    charset: 'utf-8',
  }
}

export const links = () => {
  return [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/soundwave-32.png',
      sizes: '32x32',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: '/soundwave-16.png',
      sizes: '16x16',
    },
  ]
}

const Document = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body style={{ margin: 0 }}>
        <LiveReload />
        {children}
      </body>
    </html>
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error('err boundary', error)
  return (
    <Document>
      <InitialLoader message={error.message} />
    </Document>
  )
}

export function CatchBoundary({ error }: { error: Error }) {
  console.error('catch boundary', error)
  return (
    <Document>
      <InitialLoader message={error.message} />
    </Document>
  )
}

const App = () => (
  <Document>
    <Outlet />
    <Scripts />
  </Document>
)

export default App
