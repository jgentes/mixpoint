// this file establishes the root component that renders all subsequent / child routes
// it also injects top level styling, HTML meta tags, links, and javascript for browser rendering
import { CssVarsProvider } from '@mui/joy/styles'
import { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, LiveReload, Meta, Outlet, Scripts } from '@remix-run/react'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import { ClientOnly } from 'remix-utils'
import { getState, useLiveQuery } from '~/api/db'
import ConfirmModal from '~/components/ConfirmModal'
import InitialLoader from '~/components/InitialLoader'
import Header from '~/components/layout/Header'
import Layout from '~/components/layout/Layout'
import LeftNav from '~/components/layout/LeftNav'
import TrackDrawer from '~/components/TrackDrawer'
import globalStyles from '~/styles/globalStyles.css'
import { theme } from '~/styles/theme'

const meta: MetaFunction = () => {
  return {
    title: 'Mixpoint',
    description: 'Mixpoint is multi-track audio editor for the modern dj',
    charset: 'utf-8',
  }
}

const links: LinksFunction = () => [
  {
    rel: 'icon',
    type: 'image/png',
    href: '/media/innerjoin32.png',
    sizes: '32x32',
  },
  {
    rel: 'stylesheet',
    href: 'http://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&family=Public+Sans:wght@300;400;500;700&display=swap',
  },
  {
    rel: 'stylesheet',
    href: globalStyles,
  },
]

const Document = ({ children }: { children: React.ReactNode }) => (
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

const PageLayout = () => {
  const { leftNavOpen } =
    useLiveQuery(() => getState('app', 'leftNavOpen')) || {}

  return (
    <>
      {leftNavOpen && (
        <Layout.MobileNav>
          <LeftNav />
        </Layout.MobileNav>
      )}
      <Layout.Root>
        <Layout.Header>
          <Header />
        </Layout.Header>
        <Outlet />
        <TrackDrawer />
      </Layout.Root>
    </>
  )
}

const ThemeLoader = () => {
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
          <>
            <PageLayout />
            <ConfirmModal />
          </>
        )}
      </CssVarsProvider>
    </SnackbarProvider>
  )
}

const App = () => (
  <Document>
    <ThemeLoader />
    <Scripts />
  </Document>
)

export { App as default, meta, links }
