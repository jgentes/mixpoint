// this file provides top level error and catch boundaries, plus notification handling
import { useSnackbar, VariantType } from 'notistack'
import { useEffect } from 'react'

import InitialLoader from '~/components/InitialLoader'
import Layout from '~/components/layout/Layout'

const boundaryHandler = (error: Error, variant: VariantType = 'error') => {
  const { enqueueSnackbar } = useSnackbar()
  enqueueSnackbar(error.message, { variant })
  return <InitialLoader message={error.message} />
}

const ErrorBoundary = ({ error }: { error: Error }) => boundaryHandler(error)
const CatchBoundary = ({ error }: { error: Error }) =>
  boundaryHandler(error, 'warning')

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

export { Boundary as default, ErrorBoundary, CatchBoundary }
