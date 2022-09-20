import React from 'react'
import { ErrorBoundary as Boundary } from 'react-error-boundary'
import { useSnackbar } from 'notistack'
import { InitialLoader } from './InitialLoader'

export const ErrorBoundary: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar()
  const [error, setError] = React.useState('')

  // handle errors that the error boundary won't catch
  const handleError = (err: Error) => {
    if (!err || error == err.message) return
    setError(err.message) // avoid duplicate errors
    enqueueSnackbar(`${err.message}: ${err.stack?.split('at')[1]}`, {
      variant: 'error',
    })
  }

  window.onerror = (msg, url, lineNo, columnNo, error) =>
    error && handleError(error)

  window.onunhandledrejection = (e: PromiseRejectionEvent) =>
    handleError(e.reason.message)

  return (
    <Boundary
      FallbackComponent={({ error }) => (
        <InitialLoader message="Sorry, something went wrong." />
      )}
      onError={err => handleError(err)}
    >
      {children}
    </Boundary>
  )
}
