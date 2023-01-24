// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering
import PublicSansFont from '@fontsource/public-sans/latin.css'

import { CssVarsProvider } from '@mui/joy/styles'
import { CssBaseline } from '@mui/material'
import { LinksFunction, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  useLoaderData,
} from '@remix-run/react'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import { ClientOnly } from 'remix-utils'
import ConfirmModal from '~/components/ConfirmModal'
import InitialLoader from '~/components/InitialLoader'
import { theme } from '~/theme'

const loader = async () => {
  return {
    ENV: {
      BANANA_API_KEY: process.env.BANANA_API_KEY,
      BANANA_MODEL_KEY: process.env.BANANA_MODEL_KEY,
    },
  }
}

const meta: MetaFunction = () => {
  return {
    title: 'Mixpoint',
    description: 'Mixpoint is multi-track audio mixing app for the browser',
    viewport: 'width=device-width, initial-scale=1',
  }
}

const links: LinksFunction = () => [
  {
    rel: 'icon',
    type: 'image/png',
    href: '/media/innerjoin32.png',
    sizes: '32x32',
  },
  { rel: 'stylesheet', href: PublicSansFont },
]

const HtmlDoc = ({ children }: { children: React.ReactNode }) => {
  const data = useLoaderData<typeof loader>()
  return (
    <html lang='en'>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <LiveReload />
        {children}
        <script
          // https://remix.run/docs/en/v1/guides/envvars
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
      </body>
    </html>
  )
}

const ThemeLoader = ({ noSplash }: { noSplash?: boolean }) => {
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
      <CssVarsProvider theme={theme} defaultMode={'light'}>
        {/* CSS Baseline is used to inject global styles */}
        <CssBaseline />
        {loading && !noSplash ? (
          <ClientOnly>{() => <InitialLoader />}</ClientOnly>
        ) : (
          <>
            <Outlet />
            <ConfirmModal />
          </>
        )}
      </CssVarsProvider>
    </SnackbarProvider>
  )
}

const App = () => (
  <HtmlDoc>
    <ThemeLoader />
    <Scripts />
  </HtmlDoc>
)

export { loader, App as default, ThemeLoader, meta, links }
