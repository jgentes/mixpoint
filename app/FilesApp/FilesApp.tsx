//import { TrackTable } from './TrackTable'
import { useSnackbar } from 'notistack'
import { InitialLoader } from '../components/InitialLoader'
import { Box } from '@mui/joy'
import { useLiveQuery, AppState, appState } from '../api/db'

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
  const leftNavOpen: AppState['leftNavOpen'] = useLiveQuery(
    async () => (await appState.get())?.leftNavOpen
  )

  return (
    <>
      {leftNavOpen && (
        <Layout.SideDrawer onClose={() => appState.put({ leftNavOpen: false })}>
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
        <Layout.SideNav>
          <LeftNav />
        </Layout.SideNav>
        <Layout.Main>{/* <TrackTable /> */}</Layout.Main>
      </Box>
    </>
  )
}
