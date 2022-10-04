// this file provides the layout for the application (header, left nav, main content area)
// it also provides top level error and catch boundaries, plus notification handling
import { useSnackbar, VariantType } from 'notistack'
import { notificationState } from '~/utils/notifications'
import { Outlet } from '@remix-run/react'

import InitialLoader from '~/components/InitialLoader'

const boundaryHandler = (error: Error, variant: VariantType = 'error') => {
  const { enqueueSnackbar } = useSnackbar()
  enqueueSnackbar(error.message, { variant })
  return <InitialLoader message={error.message} />
}

export const ErrorBoundary = ({ error }: { error: Error }) =>
  boundaryHandler(error)
export const CatchBoundary = ({ error }: { error: Error }) =>
  boundaryHandler(error, 'warning')

export default function Boundary() {
  const { enqueueSnackbar } = useSnackbar()

  notificationState.subscribe(({ message, variant }) =>
    enqueueSnackbar(message, { variant })
  )

  return <Outlet />
}
