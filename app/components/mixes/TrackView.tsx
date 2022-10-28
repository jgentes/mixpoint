import { Card, Typography } from '@mui/joy'
import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { loadAudioEvents } from '~/api/audioEvents'
import { db, Track, TrackState } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'
import { renderWaveform } from '~/api/renderWaveform'
import BeatResolutionControl from '~/components/tracks/BeatResolutionControl'
import EjectControl from '~/components/tracks/EjectControl'
import OffsetControl from '~/components/tracks/OffsetControl'
import Loader from '~/components/tracks/TrackLoader'
import TrackName from '~/components/tracks/TrackName'
import { errorHandler } from '~/utils/notifications'

const TrackView = ({
  trackId,
  beatResolution = 0.25,
}: {
  trackId: Track['id']
  beatResolution: TrackState['beatResolution']
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

  const setMixPoint = async () => {
    //const id = await addMix(mixState.tracks.map(t => t.id))
    //await updateMixState({ ...mixState, mix: { id } })
  }

  const timeFormat = (secs: number) =>
    new Date(secs * 1000).toISOString().substring(15, 19)

  // const playerControl = !track?.name ? null : (
  //   <Box
  //     sx={{
  //       display: 'flex',
  //       '& > *': {
  //         m: 1,
  //       },
  //     }}
  //   >
  //     <ButtonGroup
  //       size="small"
  //       variant="outlined"
  //       style={{
  //         visibility: analyzing ? 'hidden' : 'visible',
  //       }}
  //     >
  //       <ButtonGroupButton
  //         onClick={() => {
  //           EventBus.emit('audio', { effect: 'stop', tracks: [id] })
  //         }}
  //         id={`stopButton_${id}`}
  //       >
  //         <Stop />
  //         Stop
  //       </ButtonGroupButton>

  //       <ButtonGroupButton
  //         onClick={() => {
  //           EventBus.emit('audio', {
  //             effect: playing ? 'pause' : 'play',
  //             tracks: [id],
  //           })
  //         }}
  //         id={`playButton_${id}`}
  //       >
  //         {playing ? <Pause /> : <PlayArrow />}
  //         {playing ? 'Pause' : 'Play'}
  //       </ButtonGroupButton>
  //     </ButtonGroup>
  //     <TextField size="sm" variant="soft" value={timeFormat(mixPoint || 0)}>
  //       <AccessTime />
  //     </TextField>
  //   </Box>
  // )

  const trackFooter = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mt: 1,
        alignItems: 'center',
      }}
    >
      <EjectControl trackId={trackId} />
      <Typography
        sx={{
          fontSize: 'sm',
          fontWeight: 'md',
          flexBasis: '200px',
          whiteSpace: 'nowrap',
        }}
      >
        {TrackName(trackId)}
      </Typography>
      <OffsetControl trackId={trackId} />
      <BeatResolutionControl
        trackId={trackId}
        beatResolution={beatResolution}
      />
    </Box>
  )

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: 'sm',
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
