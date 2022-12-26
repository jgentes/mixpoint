'use client'

import { theme } from '#/app/theme'
import ConfirmModal from '#/components/ConfirmModal'
import { CssVarsProvider } from '@mui/joy/styles'
import { CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'

const ThemeLoader = ({ children }: { children: React.ReactNode }) => {
  return (
    <SnackbarProvider preventDuplicate maxSnack={3}>
      <CssVarsProvider theme={theme} defaultMode={'light'}>
        {/* CSS Baseline is used to inject global styles */}
        <CssBaseline />
        {children}
        <ConfirmModal />
      </CssVarsProvider>
    </SnackbarProvider>
  )
}

export { ThemeLoader as default }
