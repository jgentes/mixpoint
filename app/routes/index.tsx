import { CssVarsProvider } from '@mui/joy/styles'
import { SnackbarProvider } from 'notistack'
import { theme } from '../styles/theme'
import { FilesPage } from '../FilesApp/FilesApp'

export default function () {
  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <CssVarsProvider theme={theme} disableTransitionOnChange>
        <FilesPage />
      </CssVarsProvider>
    </SnackbarProvider>
  )
}
