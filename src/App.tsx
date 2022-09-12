import { lazy, Suspense } from 'react'
import { AppHelmet } from './components/AppHelmet'
import { CssVarsProvider } from '@mui/joy/styles'
import { InitialLoader } from './components/InitialLoader'
import { theme } from './styles/theme'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SnackbarProvider } from 'notistack'

// lazy load the app & show loading indicator
const FilesPage = lazy(() => import('./FilesApp'))

const App = () => {
  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <ErrorBoundary>
        <CssVarsProvider theme={theme}>
          <AppHelmet />
          <Suspense fallback={<InitialLoader />}>
            <FilesPage />
          </Suspense>
        </CssVarsProvider>
      </ErrorBoundary>
    </SnackbarProvider>
  )
}

export default App
