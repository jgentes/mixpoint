import { lazy, Suspense } from 'react'
import { Helmet } from 'react-helmet'
import { CssVarsProvider } from '@mui/joy/styles'
import { InitialLoader } from './components/InitialLoader'

import favIcon32 from './assets/soundwave-32.png'
import favIcon16 from './assets/soundwave-16.png'

// lazy load the app & show loading indicator
const FilesPage = lazy(() => import('./FilesApp'))

/*
window.onerror = msg =>
  Toaster.show({
    message: `Whoops! ${msg}`,
    intent: 'danger',
    icon: <Icon icon="warning-sign" />,
  })
window.onunhandledrejection = (e: PromiseRejectionEvent) =>
  Toaster.show({
    message: `Whoops! ${e.reason.message}`,
    intent: 'danger',
    icon: <WarningSign />,
  })
*/

const favIcons = [
  {
    rel: 'icon',
    type: 'image/jpg',
    sizes: '32x32',
    href: favIcon32,
  },
  {
    rel: 'icon',
    type: 'image/jpg',
    sizes: '16x16',
    href: favIcon16,
  },
]

const App = () => (
  <CssVarsProvider>
    <Helmet>
      <meta charSet="utf-8" />
      <title>MixPoint</title>
      <meta
        name="description"
        content={'MixPoint is multi-track audio editor for the modern dj'}
      />
      {favIcons.map((favIcon, index) => (
        <link {...favIcon} key={index} />
      ))}
    </Helmet>
    <Suspense fallback={<InitialLoader />}>
      <FilesPage />
    </Suspense>
  </CssVarsProvider>
)

export default App
