import React from 'react'
import { ErrorBoundary as Boundary } from 'react-error-boundary'
import { useSnackbar } from 'notistack'
import { InitialLoader } from './InitialLoader'

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
      FallbackComponent={({ error }) => (
        <InitialLoader message="Sorry, something went wrong." />
      )}
      onError={err => handleError(err.message)}
    >
      {children}
    </Boundary>
  )
}
