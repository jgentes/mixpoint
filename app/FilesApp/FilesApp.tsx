import { useState } from 'react'
//import { TrackTable } from './TrackTable'
import { useSnackbar } from 'notistack'
import { InitialLoader } from '../components/InitialLoader'
import { Box } from '@mui/joy'

// custom
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'

import LeftNav from '../components/layout/LeftNav'

export function ErrorBoundary({ error }: { error: Error }) {
  console.log('errorboundary hit')
  const { enqueueSnackbar } = useSnackbar()
  enqueueSnackbar(error.message)
  return <InitialLoader message={error.message} />
}

export const FilesPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <>
      {drawerOpen && (
        <Layout.SideDrawer onClose={() => setDrawerOpen(false)}>
          <LeftNav />
        </Layout.SideDrawer>
      )}
      <Box
        sx={{
          ...(drawerOpen && {
            height: '100vh',
            overflow: 'hidden',
          }),
          bgcolor: 'background.surface',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(64px, 200px) minmax(450px, 1fr)',
            md: 'minmax(160px, 250px) minmax(600px, 1fr)',
          },
          gridTemplateRows: '64px 1fr',
          minHeight: '100vh',
        }}
      >
        <Header />
        <LeftNav />
        <Layout.Main>{/* <TrackTable /> */}</Layout.Main>
      </Box>
    </>
  )
}
