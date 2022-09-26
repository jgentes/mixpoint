import { CssVarsProvider } from '@mui/joy/styles'
import { theme } from '../styles/theme'
import { SnackbarProvider } from 'notistack'
import { FilesPage } from '../FilesApp/FilesApp'
import { InitialLoader } from '../components/InitialLoader'
import { useEffect, useState } from 'react'
import { ClientOnly } from 'remix-utils'

export default function () {
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
          <FilesPage />
        )}
      </CssVarsProvider>
    </SnackbarProvider>
  )
}
