// this file provides top level error and catch boundaries, plus notification handling
import { useSnackbar, VariantType } from 'notistack'
import { useEffect } from 'react'

import { useRouteError, isRouteErrorResponse } from '@remix-run/react'

import InitialLoader from '~/components/InitialLoader'
import Layout from '~/components/layout/Layout'

const boundaryHandler = (message: string, variant: VariantType = 'error') => {
  const { enqueueSnackbar } = useSnackbar()
  enqueueSnackbar(message, { variant })
  return <InitialLoader message={message} />
}

const ErrorBoundary = () => {
  const error = useRouteError() as Error

  if (isRouteErrorResponse(error)) {
    return boundaryHandler(error.data.message, 'warning')
  }

  boundaryHandler(error.message || JSON.stringify(error))
}

const Boundary = () => {
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const notify = (e: CustomEventInit) =>
      enqueueSnackbar(e.detail.message, { variant: e.detail.variant })

    window.addEventListener('notify', notify)

    return () => window.removeEventListener('notify', notify)
  })

  return <Layout />
}

export { Boundary as default, ErrorBoundary }
