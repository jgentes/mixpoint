import {
  AccessTime,
  Eject,
  EventBusy,
  Favorite,
  Pause,
  PlayArrow,
  Replay,
  Stop,
} from '@mui/icons-material'
import { Card, Chip, Link, TextField, Typography } from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import { useSuperState } from '@superstate/react'
import { useEffect, useRef, useState } from 'react'
import {
  db,
  getState,
  putTrackState,
  removeFromMix,
  Track,
  TrackState,
} from '~/api/db'
import { Events } from '~/api/Events'
import { openDrawerState } from '~/components/layout/TrackDrawer'
import Loader from '~/components/tracks/TrackLoader'

// Only load initPeaks in the browser
let initWaveform: typeof import('~/api/initWaveform').initWaveform
if (typeof document !== 'undefined') {
  import('~/api/initWaveform').then(m => (initWaveform = m.initWaveform))
}

const TrackView = ({ trackState }: { trackState: TrackState }) => {
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()
  const [track, setTrack] = useState<Track | undefined>()

  useSuperState(openDrawerState)

  const { id, file, mixPoint } = trackState
  if (!id) return null

  let audioElement = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    let zoomview: WaveSurfer

    const renderWaveform = async () => {
      const track = await db.tracks.get(id)
      if (track) {
        setTrack(track)
        zoomview = await initWaveform({
          track,
          file,
          setAnalyzing,
        })
      }
    }

    renderWaveform()

    const scrollEffect = (scrollEvent: {
      direction: 'up' | 'down'
      trackId: number
    }) => {
      const { direction, trackId } = scrollEvent
      if (trackId == id)
        direction == 'down' ? zoomview.skipBackward() : zoomview.skipForward()
    }

    const audioEffect = (detail: { tracks: number[]; effect: string }) => {
      if (!detail.tracks.includes(id)) return

      setPlaying(detail.effect == 'play')

      switch (detail.effect) {
        case 'play':
          zoomview.enableAutoScroll(true)
          audioElement.current?.play()
          break
        case 'pause':
          audioElement.current?.pause()
          zoomview.enableAutoScroll(true)
          break
        case 'stop':
          audioElement.current?.pause()
          waveform?.player.seek(mixPoint || 0)
          zoomview.enableAutoScroll(true)
      }
    }

    // add event listeners
    //Events.on('audio', audioEffect)
    Events.on('scroll', scrollEffect)

    // listener cleanup
    return () => {
      Events.off('audio', audioEffect)
      Events.off('scroll', scrollEffect)
      zoomview?.destroy()
    }
  }, [id])

  const updatePlaybackRate = (bpm: number) => {
    // update play speed to new bpm
    const playbackRate = bpm / (track?.bpm || bpm)
    if (audioElement.current) audioElement.current.playbackRate = playbackRate
  }

  const adjustBpm = async (bpm?: number) => {
    // get bpm from the user input field or mixState or current track
    bpm = bpm ?? Number(track?.bpm)

    updatePlaybackRate(bpm)

    // store custom bpm value in trackstate
    //putTrackState(isFromTrack, { adjustedBpm: Number(bpm.toFixed(1)) })
  }

  const selectTime = async (time: number) => {
    // waveform?.player.seek(time)
    // zoomView?.enableAutoScroll(false)

    Events.dispatch('audio', {
      effect: 'play',
      tracks: [id],
    })

    /*
    waveform?.segments.add({
      startTime: time,
      endTime: sliderPoints[31],
      color: 'rgba(191, 191, 63, 0.5)',
      editable: true
    })
    */
  }

  const setMixPoint = async () => {
    //const id = await addMix(mixState.tracks.map(t => t.id))
    //await updateMixState({ ...mixState, mix: { id } })
  }

  const timeFormat = (secs: number) =>
    new Date(secs * 1000).toISOString().substring(15, 19)

  const adjustedBpm =
    trackState.adjustedBpm && Number(trackState.adjustedBpm).toFixed(1)

  const bpmDiff = adjustedBpm && adjustedBpm !== track?.bpm?.toFixed(1)

  const ResetBpmLink = () => (
    <Link
      component="button"
      underline="none"
      onClick={() => adjustBpm(track?.bpm || 1)}
      color="neutral"
      level="body2"
      disabled={!bpmDiff}
      title="Reset BPM"
    >
      {bpmDiff ? <Replay sx={{ mr: 0.5 }} /> : ''}BPM
    </Link>
  )

  const bpmControl = (
    <TextField
      disabled={!track?.bpm}
      size="sm"
      onChange={val => {
        console.log('changeval:', val)
        if (val) {
          if (bpmTimer) window.clearTimeout(bpmTimer)
          const debounce = window.setTimeout(() => adjustBpm(val), 1000)
          setBpmTimer(debounce)
        }
      }}
      value={adjustedBpm || track?.bpm?.toFixed(1) || 0}
      id={`bpmInput_${id}`}
      variant="outlined"
      endDecorator={<ResetBpmLink />}
    />
  )

  const playerControl = !track?.name ? null : (
    <Box
      sx={{
        display: 'flex',
        '& > *': {
          m: 1,
        },
      }}
    >
      <ButtonGroup
        size="small"
        variant="outlined"
        style={{
          visibility: analyzing ? 'hidden' : 'visible',
        }}
      >
        <ButtonGroupButton
          onClick={() => {
            Events.dispatch('audio', { effect: 'stop', tracks: [id] })
          }}
          id={`stopButton_${id}`}
        >
          <Stop />
          Stop
        </ButtonGroupButton>

        <ButtonGroupButton
          onClick={() => {
            Events.dispatch('audio', {
              effect: playing ? 'pause' : 'play',
              tracks: [id],
            })
          }}
          id={`playButton_${id}`}
        >
          {playing ? <Pause /> : <PlayArrow />}
          {playing ? 'Pause' : 'Play'}
        </ButtonGroupButton>
      </ButtonGroup>
      <TextField size="sm" variant="soft" value={timeFormat(mixPoint || 0)}>
        <AccessTime />
      </TextField>
    </Box>
  )

  const ejectTrack = async () => {
    // If this is not the last track in the mix, open drawer, otherwise it will open automatically
    const { from, to } = await getState('mix')
    if (from?.id && to?.id) openDrawerState.set(true)

    if (track) removeFromMix(track?.id)
  }

  const trackHeader = (
    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
      <Chip
        variant="outlined"
        color="primary"
        size="sm"
        onClick={() => ejectTrack()}
        sx={{
          borderRadius: 'sm',
          py: 0.25,
        }}
      >
        <Eject titleAccess="Load Track" />
      </Chip>
      <Typography sx={{ fontSize: 'sm', fontWeight: 'md' }}>
        {analyzing
          ? 'Loading...'
          : track?.name?.replace(/\.[^/.]+$/, '') || 'No Track Loaded..'}
      </Typography>

      <Link
        href="#dribbble-shot"
        level="body3"
        underline="none"
        startDecorator={<Favorite />}
        sx={{
          fontWeight: 'md',
          ml: 'auto',
          color: 'text.secondary',
          '&:hover': { color: 'danger.plainColor' },
        }}
      >
        117
      </Link>
      <Link
        href="#dribbble-shot"
        level="body3"
        underline="none"
        startDecorator={<EventBusy />}
        sx={{
          fontWeight: 'md',
          color: 'text.secondary',
          '&:hover': { color: 'primary.plainColor' },
        }}
      >
        10.4k
      </Link>
    </Box>
  )

  const loaderSx = {
    p: 0,
    border: '1px solid',
    borderColor: 'action.focus',
    borderRadius: 'sm',
    bgcolor: 'background.body',
    overflow: 'hidden',
    height: '100px',
  }

  return (
    <Card
      variant="soft"
      sx={{
        // pt: 5,
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'action.selected',
      }}
    >
      <Card
        id={`zoomview-container_${id}`}
        sx={{
          ...loaderSx,
          zIndex: 1,
        }}
        onWheel={e =>
          Events.emit('scroll', {
            direction: e.deltaY > 100 ? 'down' : 'up',
            trackId: id,
          })
        }
      ></Card>
      {trackHeader}
      {!analyzing ? null : (
        <Card
          sx={{
            ...loaderSx,
            zIndex: 2,
            position: 'absolute',
            inset: 16,
          }}
        >
          <Loader style={{ margin: 'auto' }} />
        </Card>
      )}
    </Card>
  )
}

export default TrackView
