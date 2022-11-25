import { Box } from '@mui/joy'
import { getState, useLiveQuery } from '~/api/dbHandlers'
import Header from '~/components/header/Header'
import MixView from '~/components/mixes/MixView'
import DrawerButton from '~/components/tracks/DrawerButton'
import TrackDrawer from '~/components/tracks/TrackDrawer'
import TrackTable from '~/components/tracks/TrackTable'

const Mixes: React.FunctionComponent = () => {
  const { tracks = [] } = useLiveQuery(() => getState('mix')) || {}

  const mixViewVisible = !!tracks.length

  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      {mixViewVisible ? (
        <>
          <MixView />
          <DrawerButton />
        </>
      ) : (
        <TrackTable />
      )}
      <TrackDrawer />
    </Box>
  )
}

export { Mixes as default }
