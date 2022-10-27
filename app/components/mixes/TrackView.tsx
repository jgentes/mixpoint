import {
  AccessTime,
  Eject,
  Pause,
  PlayArrow,
  Replay,
  Stop,
} from '@mui/icons-material'
import {
  Card,
  Chip,
  Link,
  Radio,
  radioClasses,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import { useSuperState } from '@superstate/react'
import { useEffect, useRef, useState } from 'react'
import { loadAudioEffects } from '~/api/audioEffects'
import {
  db,
  getState,
  removeFromMix,
  TrackState,
  useLiveQuery,
} from '~/api/dbHandlers'
import { Events } from '~/api/Events'
import { renderWaveform } from '~/api/renderWaveform'
import { openDrawerState } from '~/components/layout/TrackDrawer'
import Loader from '~/components/tracks/TrackLoader'

const TrackView = ({ trackState }: { trackState: TrackState }) => {
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()

  useSuperState(openDrawerState)

  const { id, mixPoint } = trackState
  if (!id) return null

  let audioElement = useRef<HTMLAudioElement>(null)

  const track = useLiveQuery(() => db.tracks.get(id))

  useEffect(() => {
    let waveform: WaveSurfer

    const renderTrack = async () => {
      if (track) {
        waveform = await renderWaveform({
          track,
          trackState,
          setAnalyzing,
        })

        await loadAudioEffects({ track, trackState, waveform })
      }
    }

    renderTrack()

    return () => waveform?.destroy()
  }, [track])

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

    Events.emit('audio', {
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
            Events.emit('audio', { effect: 'stop', tracks: [id] })
          }}
          id={`stopButton_${id}`}
        >
          <Stop />
          Stop
        </ButtonGroupButton>

        <ButtonGroupButton
          onClick={() => {
            Events.emit('audio', {
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
    // If this is not the last track in the mix, open drawer, otherwise the drawer will open automatically
    const { from, to } = await getState('mix')
    if (from?.id && to?.id) openDrawerState.set(true)

    if (track) removeFromMix(track?.id)
  }

  const changeBeatResolution = (beatResolution: TrackState['beatResolution']) =>
    Events.emit('beatResolution', { trackId: track?.id, beatResolution })

  const trackFooter = (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mt: 1,
        alignItems: 'center',
      }}
    >
      <Chip
        variant="outlined"
        color="primary"
        size="sm"
        onClick={() => ejectTrack()}
        sx={{
          borderRadius: 'sm',
        }}
      >
        <Eject titleAccess="Load Track" />
      </Chip>
      <Typography
        sx={{
          fontSize: 'sm',
          fontWeight: 'md',
          flexBasis: '200px',
          whiteSpace: 'nowrap',
        }}
      >
        {analyzing
          ? 'Loading...'
          : track?.name?.replace(/\.[^/.]+$/, '') || 'No Track Loaded..'}
      </Typography>

      <RadioGroup
        row
        name="beatResolution"
        value={trackState.beatResolution}
        variant="outlined"
        sx={{ ml: 'auto' }}
        onChange={e =>
          changeBeatResolution(+e.target.value as TrackState['beatResolution'])
        }
      >
        {[0.25, 0.5, 1].map(item => (
          <Box
            key={item}
            sx={theme => ({
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 48,
              height: 24,
              '&:not([data-first-child])': {
                borderLeft: '1px solid',
                borderColor: 'divider',
              },
              [`&[data-first-child] .${radioClasses.action}`]: {
                borderTopLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
                borderBottomLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              },
              [`&[data-last-child] .${radioClasses.action}`]: {
                borderTopRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
                borderBottomRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              },
            })}
          >
            <Radio
              value={item}
              disableIcon
              overlay
              label={`${item * 100}%`}
              variant={trackState.beatResolution == item ? 'outlined' : 'plain'}
              color="primary"
              sx={{
                fontSize: '12px',
                color: 'text.secondary',
              }}
              componentsProps={{
                action: {
                  sx: { borderRadius: 0, transition: 'none' },
                },
                label: { sx: { lineHeight: 0 } },
              }}
            />
          </Box>
        ))}
      </RadioGroup>
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
