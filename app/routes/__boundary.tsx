// this file provides the layout for the application (header, left nav, main content area)
// it also provides top level error and catch boundaries, plus notification handling
import { Outlet } from '@remix-run/react'
import { useSnackbar, VariantType } from 'notistack'
import { useEffect } from 'react'
import { notificationState } from '~/utils/notifications'

import InitialLoader from '~/components/InitialLoader'

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
    const unsubscribe = notificationState.subscribe(({ message, variant }) =>
      enqueueSnackbar(message, { variant })
    )

    return () => unsubscribe()
  })

  return <Outlet />
}

export { Boundary as default, ErrorBoundary, CatchBoundary }
