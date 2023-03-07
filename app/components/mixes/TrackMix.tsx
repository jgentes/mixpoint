import { Box, Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { ClientOnly } from 'remix-utils'
import { audioState, tableState } from '~/api/appState'
import {
  getTrackName,
  Stem,
  STEMS,
  Track,
  useLiveQuery,
} from '~/api/db/dbHandlers'
import Waveform from '~/api/renderWaveform'
import StemAccessButton from '~/components/mixes/StemAccessButton'
import VolumeMeter from '~/components/mixes/VolumeMeter'
import {
  BeatResolutionControl,
  BpmControl,
  EjectControl,
  MixpointControl,
  MixpointNavControl,
  OffsetControl,
  StemControl,
  TrackNavControl,
} from '~/components/tracks/Controls'
import Dropzone from '~/components/tracks/Dropzone'
import Loader from '~/components/tracks/TrackLoader'
import { errorHandler } from '~/utils/notifications'
import { timeFormat } from '~/utils/tableOps'

const TrackMix = ({ trackId }: { trackId: Track['id'] }) => {
  const [analyzingTracks] = tableState.analyzing()
  const analyzing = analyzingTracks.includes(trackId)

  const [stemState] = audioState[trackId!].stemState()
  const trackName = useLiveQuery(() => getTrackName(trackId), [trackId])

  const TrackTime = () => {
    const [time = 0] = audioState[trackId!].time()
    const [nudged] = audioState[trackId!].nudged()

    // adjust time marker on waveform
    const [waveform] = audioState[trackId!].waveform()

    if (waveform) {
      const drawerTime = 1 / (waveform.getDuration() / time) || 0
      waveform.drawer.progress(drawerTime)
      //@ts-ignore - minimap does indeed have a drawer.progress method
      waveform.minimap.drawer.progress(drawerTime)
    }

    return (
      <Typography sx={{ fontSize: 'sm' }}>
        {timeFormat(time)}
        {nudged ? (nudged == 'backward' ? ' -' : ' +') : ''}
      </Typography>
    )
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
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Typography
          sx={{
            fontSize: 'sm',
            fontWeight: 'md',
            pl: '3px',
            color: 'text.secondary',
          }}
        >
          Time:
        </Typography>
        <TrackTime />
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          marginLeft: 'auto',
        }}
      >
        <BeatResolutionControl trackId={trackId} />
      </Box>
    </Box>
  )

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
          marginRight: 'auto',
        }}
      >
        <MixpointControl trackId={trackId} />
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          marginLeft: 'auto',
        }}
      >
        <OffsetControl trackId={trackId} />
      </Box>
    </Box>
  )

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: '4px',
    borderBottom: 'none',
    bgcolor: 'background.body',
    overflow: 'hidden',
    zIndex: 1,
  }

  return !trackId ? (
    <Dropzone />
  ) : (
    <>
      {trackHeader}
      {/* {stemState !== 'ready' ? (
        <StemAccessButton trackId={trackId} />
      ) : (
        STEMS.map(stem => (
          <div key={stem}>
            <StemControl trackId={trackId} stemType={stem as Stem} />
          </div>
        ))
      )} */}
      <ClientOnly>
        {() => (
          <Waveform trackId={trackId} sx={{ ...loaderSx, height: '80px' }} />
        )}
      </ClientOnly>

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
    </>
  )
}

export { TrackMix as default }
