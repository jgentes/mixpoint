import { Box } from '@mui/joy'
import { MixPrefs } from '~/api/db/dbHandlers'
import StemsCard from '~/components/mixes/StemsCard'
import TrackCard from '~/components/mixes/TrackCard'
import { MixControl } from '~/components/tracks/Controls'

const MixView = ({ tracks }: { tracks: MixPrefs['tracks'] }) => {
  if (!tracks?.length) return null

  return (
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
        <StemsCard trackId={tracks[0]} />
        <MixControl tracks={tracks} />
        <StemsCard trackId={tracks[1]} />
      </div>
    </Box>
  )
}

export { MixView as default }
