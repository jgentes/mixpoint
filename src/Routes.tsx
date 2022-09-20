import { lazy, Suspense } from 'react'
import { AppHelmet } from './components/AppHelmet'
import { CssVarsProvider } from '@mui/joy/styles'
import { InitialLoader } from './components/InitialLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SnackbarProvider } from 'notistack'
import { theme } from './styles/theme'
import { useRoutes } from 'hookrouter'

// lazy load the app & show loading indicator
const FilesPage = lazy(() => import('./FilesApp/FilesApp'))

export const Routes: React.FunctionComponent = () => {
  const routes = useRoutes({ '/': () => <FilesPage /> })

  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <ErrorBoundary>
        <CssVarsProvider theme={theme} disableTransitionOnChange>
          <AppHelmet />
          <Suspense fallback={<InitialLoader />}>{routes}</Suspense>
        </CssVarsProvider>
      </ErrorBoundary>
    </SnackbarProvider>
  )
}
