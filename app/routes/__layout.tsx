// this file provides the layout for the application (header, left nav, main content area)
// it also provides top level error and catch boundaries, plus notification handling
import { useSnackbar } from 'notistack'
import { notification } from '~/utils/notifications'
import { Box } from '@mui/joy'
import { useLiveQuery, getState, putState } from '~/api/db'
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
        <Layout.SideDrawer
          onClose={() => putState('app', { leftNavOpen: false })}
        >
          <LeftNav />
        </Layout.SideDrawer>
      )}
      <Box
        sx={{
          bgcolor: 'background.surface',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(64px, 200px) minmax(450px, 1fr)',
            md: 'minmax(160px, 250px) minmax(600px, 1fr)',
          },
          gridTemplateRows: '64px 1fr',
          minHeight: '100vh',
          ...(leftNavOpen && {
            height: '100vh',
            overflow: 'hidden',
          }),
        }}
      >
        <Header />
        <Layout.LeftNav>
          <LeftNav />
        </Layout.LeftNav>
        <Layout.Main>
          <Outlet />
        </Layout.Main>
      </Box>
    </>
  )
}
