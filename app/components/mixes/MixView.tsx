import { Box } from '@mui/joy'
import { MixPrefs } from '~/api/db/dbHandlers'
import StemsCard from '~/components/mixes/StemsCard'
import TrackCard from '~/components/mixes/TrackCard'
import TrackMix from '~/components/mixes/TrackMix'
import {
  CrossfaderControl,
  MixControl,
  StemsCrossfaders,
} from '~/components/tracks/Controls'

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 15,
        }}
      >
        <TrackCard trackId={tracks[0]} />

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CrossfaderControl />
          <MixControl tracks={tracks} />
        </Box>
        <TrackCard trackId={tracks[1]} />
      </div>
      {/* <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 15,
        }}
      >
        <TrackMix trackId={tracks[0]} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <StemsCrossfaders />
        </Box>

        <TrackMix trackId={tracks[1]} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 15,
        }}
      >
        <StemsCard trackId={tracks[0]} />
        <StemsCard trackId={tracks[1]} />
      </div> */}
    </Box>
  )
}

export { MixView as default }
