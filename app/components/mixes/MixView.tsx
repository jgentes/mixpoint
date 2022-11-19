import { Box } from '@mui/joy'
import { MixTrack } from '~/api/dbHandlers'
import OverviewCard from '~/components/mixes/OverviewCard'
import TrackCard from '~/components/mixes/TrackCard'
import { MixControl } from '~/components/tracks/Controls'

const MixView = ({
  fromState,
  toState,
}: {
  fromState: MixTrack
  toState: MixTrack
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: 2,
    }}
  >
    {!fromState?.id ? null : (
      <TrackCard
        trackId={fromState.id}
        beatResolution={fromState.beatResolution}
      />
    )}
    {!toState?.id ? null : (
      <TrackCard trackId={toState.id} beatResolution={toState.beatResolution} />
    )}
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 15,
      }}
    >
      {!fromState?.id ? null : <OverviewCard trackId={fromState.id} />}

      {!fromState?.id || !toState?.id ? null : (
        <MixControl fromState={fromState} toState={toState} />
      )}

      {!toState?.id ? null : <OverviewCard trackId={toState.id} />}
    </div>
  </Box>
)

export { MixView as default }
