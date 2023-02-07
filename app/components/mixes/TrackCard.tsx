import { Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { ClientOnly } from 'remix-utils'
import { audioState, tableState } from '~/api/appState'
import { getTrackName, Track, useLiveQuery } from '~/api/db/dbHandlers'
import Waveform from '~/api/renderWaveform'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
  BeatResolutionControl,
  BpmControl,
  EjectControl,
  MixpointControl,
  MixpointNavControl,
  OffsetControl,
  TrackNavControl,
} from '~/components/tracks/Controls'
import Loader from '~/components/tracks/TrackLoader'
import { errorHandler } from '~/utils/notifications'
import { timeFormat } from '~/utils/tableOps'

const TrackCard = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return errorHandler('Please try uploading the track again.')

  const [analyzingTracks] = tableState.analyzing()
  const analyzing = analyzingTracks.includes(trackId)

  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  const TrackTime = () => {
    const [time = 0] = audioState[trackId].time()
    const [nudged] = audioState[trackId!].nudged()

    return (
      <Typography sx={{ fontSize: 'sm' }}>
        {timeFormat(time)}
        {nudged ? (nudged == 'backward' ? ' -' : ' +') : ''}
      </Typography>
    )
  }

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
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexBasis: 'calc(50% - ((160px + 16px) / 2))', // center audio controls
          maxWidth: 'calc(50% - ((160px + 16px) / 2))', // 160 is width of TrackNavControl
        }}
      >
        <BpmControl trackId={trackId} />
        <TrackTime />
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
    borderRadius: '6px',
    borderBottom: 'none',
    bgcolor: 'background.body',
    overflow: 'hidden',
    zIndex: 1,
  }

  const trackHeader = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mb: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box
        id='track-title'
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
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
          {trackName}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <MixpointNavControl trackId={trackId} />
        <MixpointControl trackId={trackId} />
      </Box>
    </Box>
  )

  return (
    <Card
      variant='soft'
      sx={{
        p: 1,
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'action.selected',
      }}
    >
      {trackHeader}
      <ClientOnly>
        {() => (
          <Waveform trackId={trackId} sx={{ ...loaderSx, height: '80px' }} />
        )}
      </ClientOnly>

      <Card
        id={`overview-container_${trackId}`}
        sx={{
          ...loaderSx,
          height: '25px',
          mt: 1,
        }}
      />

      <VolumeMeter trackId={trackId} />

      {trackFooter}

      {!analyzing ? null : (
        <Card
          sx={{
            ...loaderSx,
            zIndex: 2,
            position: 'absolute',
            inset: '40px 8px calc(100% - 120px) 8px',
          }}
        >
          <Loader style={{ margin: 'auto' }} />
        </Card>
      )}
    </Card>
  )
}

export { TrackCard as default }
