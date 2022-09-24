import '@fontsource/roboto-mono/400.css'
import '@fontsource/public-sans/300.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/700.css'

import { CssVarsProvider } from '@mui/joy/styles'
import { InitialLoader } from '../components/InitialLoader'
import { SnackbarProvider } from 'notistack'
import { theme } from '../styles/theme'
import { FilesPage } from '../FilesApp/FilesApp'

export default function () {
  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <CssVarsProvider theme={theme} disableTransitionOnChange>
        Hello
      </CssVarsProvider>
    </SnackbarProvider>
  )
}
