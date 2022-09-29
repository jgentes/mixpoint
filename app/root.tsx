// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering
import { Links, Meta, LiveReload, Scripts } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { CssVarsProvider } from '@mui/joy/styles'
import { theme } from '~/styles/theme'
import { SnackbarProvider } from 'notistack'
import { ClientOnly } from 'remix-utils'

import fonts from '~/styles/fonts.css'
import PageLayout from '~/components/PageLayout'
import InitialLoader from '~/components/InitialLoader'

export function meta() {
  return {
    title: 'Mixpoint',
    description: 'Mixpoint is multi-track audio editor for the modern dj',
    charset: 'utf-8',
  }
}

export function links() {
  return [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/media/soundwave-32.png',
      sizes: '32x32',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: '/media/soundwave-16.png',
      sizes: '16x16',
    },
    {
      rel: 'stylesheet',
      href: fonts,
    },
  ]
}

function Document({ children }: { children: React.ReactNode }) {
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

function ThemeLoader() {
  const [loading, setLoading] = useState(true)

  // InitialLoader is used to hide the flash of unstyled content
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <CssVarsProvider theme={theme} disableTransitionOnChange>
        {loading ? (
          <ClientOnly>{() => <InitialLoader />}</ClientOnly>
        ) : (
          <PageLayout />
        )}
      </CssVarsProvider>
    </SnackbarProvider>
  )
}

function App() {
  return (
    <Document>
      <ThemeLoader />
      <Scripts />
    </Document>
  )
}

export default App
