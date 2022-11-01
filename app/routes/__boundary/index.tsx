import { Box } from '@mui/joy'
import { getState, useLiveQuery } from '~/api/dbHandlers'
import Header from '~/components/layout/Header'
import TrackDrawer from '~/components/layout/TrackDrawer'
import TrackCard from '~/components/mixes/TrackCard'
import TrackView from '~/components/mixes/TrackView'
import { MixControl } from '~/components/tracks/Controls'
import TrackTable from '~/components/tracks/TrackTable'

const Mixes: React.FunctionComponent = () => {
  const { from: fromState, to: toState } =
    useLiveQuery(() => getState('mix')) || {}

  return (
    <Box
      sx={{
        bgcolor: 'background.surface',
        height: '100%',
      }}
    >
      <Header />
      {!fromState?.id && !toState?.id ? (
        <TrackTable hideDrawerButton={true} />
      ) : (
        <Box component="main" sx={{ p: 2, height: '90vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {!fromState?.id ? null : (
              <TrackView
                trackId={fromState.id}
                beatResolution={fromState.beatResolution}
              />
            )}
            {!toState?.id ? null : (
              <TrackView
                trackId={toState.id}
                beatResolution={toState.beatResolution}
              />
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 15,
              }}
            >
              {!fromState?.id ? null : <TrackCard trackId={fromState.id} />}

              {!fromState?.id || !toState?.id ? null : (
                <MixControl fromState={fromState} toState={toState} />
              )}

              {!toState?.id ? null : <TrackCard trackId={toState.id} />}
            </div>
          </div>

          <TrackDrawer />
        </Box>
      )}
    </Box>
  )
}

export { Mixes as default }
