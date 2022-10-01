// this file provides the layout for the application (header, left nav, main content area)
// it also provides top level error and catch boundaries, plus notification handling
import { useSnackbar } from 'notistack'
import { notification } from '~/utils/notifications'
import { useLiveQuery, getState } from '~/api/db'
import { Outlet } from '@remix-run/react'

import InitialLoader from '~/components/InitialLoader'
import Layout from '~/components/layout/Layout'
import Header from '~/components/layout/Header'
import LeftNav from '~/components/layout/LeftNav'

export function ErrorBoundary({ error }: { error: Error }) {
  const { enqueueSnackbar } = useSnackbar()
  enqueueSnackbar(error.message, { variant: 'error' })
  return <InitialLoader message={error.message} />
}

export function CatchBoundary({ error }: { error: Error }) {
  const { enqueueSnackbar } = useSnackbar()
  enqueueSnackbar(error.message, { variant: 'warning' })
  return <InitialLoader message={error.message} />
}

export default function PageLayout() {
  const { enqueueSnackbar } = useSnackbar()
  const leftNavOpen = useLiveQuery(() => getState('app')?.leftNavOpen)

  notification.subscribe(({ message, variant }) =>
    enqueueSnackbar(message, { variant })
  )

  return (
    <>
      {leftNavOpen && (
        <Layout.MobileNav>
          <LeftNav />
        </Layout.MobileNav>
      )}
      <Layout.Root>
        <Layout.Header>
          <Header />
        </Layout.Header>
        <Layout.LeftNav>
          <LeftNav />
        </Layout.LeftNav>
        <Layout.MainContent>
          <Outlet />
        </Layout.MainContent>
      </Layout.Root>
    </>
  )
}
