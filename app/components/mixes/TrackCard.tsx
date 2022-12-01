import { Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { ClientOnly } from 'remix-utils'
import { audioState } from '~/api/appState'
import { Track } from '~/api/dbHandlers'
import { Waveform } from '~/api/renderWaveform'
import {
  BeatResolutionControl,
  EjectControl,
  OffsetControl,
  TrackNavControl,
} from '~/components/tracks/Controls'
import Loader from '~/components/tracks/TrackLoader'
import TrackName from '~/components/tracks/TrackName'
import { errorHandler } from '~/utils/notifications'

const TrackCard = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) throw errorHandler('Please try uploading the track again.')

  const [analyzingTracks] = audioState.analyzing()
  const analyzing = analyzingTracks.includes(trackId)

  const trackFooter = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mt: 1,
        alignItems: 'center',
      }}
    >
      <Box
        id="track-title"
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexBasis: 'calc(50% - ((200px + 16px) / 2))', // center audio controls
          maxWidth: 'calc(50% - ((200px + 16px) / 2))',
        }}
      >
        <EjectControl trackId={trackId} />
        <Typography
          sx={{
            fontSize: 'sm',
            fontWeight: 'md',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {TrackName(trackId)}
        </Typography>
      </Box>

      <TrackNavControl trackId={trackId} />

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          marginLeft: 'auto',
        }}
      >
        <OffsetControl trackId={trackId} />
        <BeatResolutionControl trackId={trackId} />
      </Box>
    </Box>
  )

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: 'sm',
    borderBottom: 'none',
    bgcolor: 'background.body',
    overflow: 'hidden',
    height: '80px',
  }

  return (
    <Card
      variant="soft"
      sx={{
        p: 1,
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'action.selected',
      }}
    >
      <ClientOnly>
        {() => <Waveform trackId={trackId} sx={loaderSx} />}
      </ClientOnly>

      {trackFooter}

      {!analyzing ? null : (
        <Card
          sx={{
            ...loaderSx,
            zIndex: 2,
            position: 'absolute',
            inset: 8,
          }}
        >
          <Loader style={{ margin: 'auto' }} />
        </Card>
      )}
    </Card>
  )
}

export { TrackCard as default }
