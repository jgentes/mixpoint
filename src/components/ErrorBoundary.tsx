import React from 'react'
import { ErrorBoundary as Boundary } from 'react-error-boundary'
import { useSnackbar } from 'notistack'

export const ErrorBoundary: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar()

  // handle errors that the error boundary won't catch
  const handleError = (msg: string | undefined) =>
    enqueueSnackbar(msg, { variant: 'error' })

  window.onerror = (msg, url, lineNo, columnNo, error) =>
    handleError(error?.message)

  window.onunhandledrejection = (e: PromiseRejectionEvent) =>
    handleError(e.reason.message)

  return (
    <Boundary
      FallbackComponent={({ error }) => {
        enqueueSnackbar(error.message, { variant: 'error' })
        return <></>
      }}
      onError={err => {
        console.log('ErrorBoundary', err)
        enqueueSnackbar(err.message, { variant: 'error' })
      }}
    >
      {children}
    </Boundary>
  )
}
