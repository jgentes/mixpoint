import {
  AccessTime,
  CreateNewFolder,
  Eject,
  Favorite,
  Pause,
  PlayArrow,
  Replay,
  Stop,
} from '@mui/icons-material'
import {
  Button,
  Card,
  CardCover,
  IconButton,
  Link,
  TextField,
  Typography,
} from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { db, putTrackState, Track, TrackState } from '~/api/db'
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

  const trackHeader = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        // position: 'absolute',
        // inset: 0,
        // padding: '15px 5px 0 20px',
      }}
    >
      <div
        style={{
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {/* <Button
          size="sm"
          variant="outlined"
          onClick={() => openDrawerState.set(true)}
          id={`loadButton_${id}`}
          style={{ marginRight: '8px' }}
        >
          <Eject titleAccess="Load Track" />
        </Button> */}

        <Typography
          level="body1"
          sx={{
            display: 'inline',
            verticalAlign: 'text-bottom',
          }}
        >
          {analyzing
            ? 'Loading..'
            : track?.name?.replace(/\.[^/.]+$/, '') || 'No Track Loaded..'}
        </Typography>
      </div>
    </div>
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
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Card
          id={`zoomview-container_${id}`}
          sx={{
            ...loaderSx,
            zIndex: 1,

            '.wavesurfer-playhead': {
              width: 0,
              height: 0,
              marginLeft: '5px',
              borderStyle: 'solid',
              borderWidth: '7px 7px 0 7px',
              borderColor: '#0492f79e transparent transparent transparent',
            },

            '.wavesurfer-playhead svg': {
              display: 'none',
            },
          }}
          onWheel={e =>
            Events.emit('scroll', {
              direction: e.deltaY > 100 ? 'down' : 'up',
              trackId: id,
            })
          }
        ></Card>
        <CardCover
          className="gradient-cover"
          sx={{
            '&:hover, &:focus-within': {
              opacity: 1,
            },
            opacity: 0,
            transition: '0.1s ease-in',
            background:
              'linear-gradient(180deg, transparent 62%, rgba(0,0,0,0.00345888) 63.94%, rgba(0,0,0,0.014204) 65.89%, rgba(0,0,0,0.0326639) 67.83%, rgba(0,0,0,0.0589645) 69.78%, rgba(0,0,0,0.0927099) 71.72%, rgba(0,0,0,0.132754) 73.67%, rgba(0,0,0,0.177076) 75.61%, rgba(0,0,0,0.222924) 77.56%, rgba(0,0,0,0.267246) 79.5%, rgba(0,0,0,0.30729) 81.44%, rgba(0,0,0,0.341035) 83.39%, rgba(0,0,0,0.367336) 85.33%, rgba(0,0,0,0.385796) 87.28%, rgba(0,0,0,0.396541) 89.22%, rgba(0,0,0,0.4) 91.17%)',
          }}
        >
          {/* The first box acts as a container that inherits style from the CardCover */}
          <Box>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexGrow: 1,
                alignSelf: 'flex-end',
              }}
            >
              <Typography level="h2" noWrap sx={{ fontSize: 'lg' }}>
                <Link
                  href="#dribbble-shot"
                  overlay
                  underline="none"
                  sx={{
                    color: '#fff',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  Yosemite
                </Link>
              </Typography>
              <IconButton size="sm" color="neutral" sx={{ ml: 'auto' }}>
                <CreateNewFolder />
              </IconButton>
              <IconButton size="sm" color="neutral">
                <Favorite />
              </IconButton>
            </Box>
          </Box>
        </CardCover>
      </Box>
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
