import { getState, useLiveQuery } from '#/app/api/dbHandlers'
import OverviewCard from '#/components/mixes/OverviewCard'
import TrackCard from '#/components/mixes/TrackCard'
import { MixControl } from '#/components/tracks/Controls'
import { Box } from '@mui/joy'

const MixView = () => {
  const { tracks = [] } = useLiveQuery(() => getState('mix')) || {}

  return !tracks.length ? null : (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
      }}
    >
      {tracks.map((id, i) => (
        <TrackCard trackId={id} key={i} />
      ))}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 15,
        }}
      >
        {/* Hardcoding 2 tracks for now */}
        <OverviewCard trackId={tracks[0]} />
        <MixControl tracks={tracks} />
        <OverviewCard trackId={tracks[1]} />
      </div>
    </Box>
  )
}

export { MixView as default }
