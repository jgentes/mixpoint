import { lazy, Suspense } from 'react'
import { AppHelmet } from './components/AppHelmet'
import { CssVarsProvider } from '@mui/joy/styles'
import { InitialLoader } from './components/InitialLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SnackbarProvider } from 'notistack'
import { theme } from './styles/theme'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// lazy load the app & show loading indicator
const FilesPage = lazy(() => import('./FilesApp/FilesApp'))
const Tracks = lazy(() => import('./routes/tracks/tracks'))

const router = createBrowserRouter([
  { path: '/', element: <FilesPage /> },
  { path: '/tracks', element: <Tracks /> },
])

const App = () => {
  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <ErrorBoundary>
        <CssVarsProvider theme={theme} disableTransitionOnChange>
          <AppHelmet />
          <Suspense fallback={<InitialLoader />}>
            <RouterProvider router={router} />
          </Suspense>
        </CssVarsProvider>
      </ErrorBoundary>
    </SnackbarProvider>
  )
}

export default App
