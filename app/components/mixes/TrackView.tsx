import { Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { loadAudioEvents } from '~/api/audioEvents'
import { db, MixTrack, Track } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { renderWaveform } from '~/api/renderWaveform'
import {
  BeatResolutionControl,
  EjectControl,
  OffsetControl,
  TrackAudioControl,
} from '~/components/tracks/Controls'
import Loader from '~/components/tracks/TrackLoader'
import TrackName from '~/components/tracks/TrackName'
import { errorHandler } from '~/utils/notifications'

const TrackView = ({
  trackId,
  beatResolution = 0.25,
}: {
  trackId: Track['id']
  beatResolution: MixTrack['beatResolution']
}) => {
  if (!trackId) throw errorHandler('Please try uploading the track again.')

  const [analyzing, setAnalyzing] = useState(false)

  // View component must be in the DOM before rendering waveform
  useEffect(() => {
    let waveform: WaveSurfer

    const renderTrack = async () => {
      waveform = await renderWaveform({
        trackId,
        setAnalyzing,
      })

      await loadAudioEvents({ trackId, waveform })
    }

    renderTrack()

    return () => waveform?.destroy()
  }, [trackId])

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
          flexBasis: 'calc(50% - 69px)',
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
      <TrackAudioControl trackId={trackId} />
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'end',
        }}
      >
        <OffsetControl trackId={trackId} />
        <BeatResolutionControl
          trackId={trackId}
          beatResolution={beatResolution}
        />
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
      <Card
        id={`zoomview-container_${trackId}`}
        sx={{
          ...loaderSx,
          zIndex: 1,
        }}
        onWheel={e =>
          EventBus.emit('scroll', {
            direction: e.deltaY > 100 ? 'down' : 'up',
            trackId,
          })
        }
      ></Card>
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

export default TrackView
