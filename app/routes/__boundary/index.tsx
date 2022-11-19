import { Box } from '@mui/joy'
import { getState, useLiveQuery } from '~/api/dbHandlers'
import DrawerButton from '~/components/layout/DrawerButton'
import Header from '~/components/layout/Header'

import MixView from '~/components/mixes/MixView'
import TrackTable from '~/components/tracks/TrackTable'

const Mixes: React.FunctionComponent = () => {
  const { from: fromState, to: toState } =
    useLiveQuery(() => getState('mix')) || {}

  const mixViewVisible = fromState?.id || toState?.id

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
        <MixView fromState={fromState!} toState={toState!} />
      ) : (
        <TrackTable />
      )}
      {mixViewVisible ? <DrawerButton /> : null}
    </Box>
  )
}

export { Mixes as default }
