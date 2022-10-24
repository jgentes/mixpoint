import {
  AccessTime,
  Eject,
  Pause,
  PlayArrow,
  Replay,
  Stop,
} from '@mui/icons-material'
import { Button, Card, Link, TextField, Typography } from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import Slider, { SliderProps } from 'rc-slider'
import { useEffect, useRef, useState } from 'react'
import { db, putTrackState, Track, TrackState } from '~/api/db'
import { Events } from '~/api/Events'
import { openDrawerState } from '~/components/layout/TrackDrawer'
import Loader from '~/components/tracks/TrackLoader'

// Only load initPeaks in the browser
let initPeaks: typeof import('~/api/initPeaks').initPeaks
if (typeof document !== 'undefined') {
  import('~/api/initPeaks').then(m => (initPeaks = m.initPeaks))
}

interface SliderControlProps extends SliderProps {
  width: number
}

const TrackForm = ({
  trackState,
  isFromTrack,
}: {
  trackState: TrackState
  isFromTrack: boolean
}) => {
  const [sliderControl, setSliderControl] = useState<SliderControlProps>()
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [audioSrc, setAudioSrc] = useState('')
  const [bpmTimer, setBpmTimer] = useState<number>()
  const [track, setTrack] = useState<Track | undefined>()
  const [zoomview, setZoomview] = useState<WaveSurfer | undefined>()
  const zoomviewRef = useRef(null)

  const { id, file, mixPoint } = trackState
  if (!id) return null

  let audioElement = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    let zoomview: WaveSurfer
    const renderWaveform = async () => {
      const track = await db.tracks.get(id)
      if (track) {
        setTrack(track)
        zoomview = await initPeaks({
          track,
          file,
          zoomviewRef,
          isFromTrack,
          setAnalyzing,
          setAudioSrc,
          setSliderControl,
        })

        //if (zoomview) setZoomview(zoomview)
      }
    }

    renderWaveform()

    // add event listeners
    //Events.on('audio', audioEffect)

    // listener cleanup
    return () => {
      Events.remove('audio', audioEffect)
      zoomview?.destroy()
    }
  }, [id, isFromTrack])

  const audioEffect = (detail: { tracks: number[]; effect: string }) => {
    if (!detail.tracks.includes(id)) return

    setPlaying(detail.effect == 'play')

    switch (detail.effect) {
      case 'play':
        zoomView?.enableAutoScroll(true)
        audioElement.current?.play()
        break
      case 'pause':
        audioElement.current?.pause()
        zoomView?.enableAutoScroll(true)
        break
      case 'stop':
        audioElement.current?.pause()
        waveform?.player.seek(mixPoint || 0)
        zoomView?.enableAutoScroll(true)
    }
  }

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
    putTrackState(isFromTrack, { adjustedBpm: Number(bpm.toFixed(1)) })
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
      variant="soft"
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
        marginBottom: isFromTrack ? '5px' : 0,
        marginTop: isFromTrack ? 0 : '10px',
      }}
    >
      <div
        style={{
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <Button
          size="sm"
          variant="outlined"
          onClick={() => openDrawerState.set(true)}
          id={`loadButton_${id}`}
          style={{ marginRight: '8px' }}
        >
          <Eject titleAccess="Load Track" />
        </Button>

        <Typography
          level="h5"
          style={{
            display: 'inline',
            verticalAlign: isFromTrack ? 'text-bottom' : 'middle',
          }}
        >
          {analyzing
            ? 'Loading..'
            : track?.name?.replace(/\.[^/.]+$/, '') || 'No Track Loaded..'}
        </Typography>
      </div>
      {bpmControl}
    </div>
  )

  const slider = (
    <div
      style={{
        overflow: 'scroll',
        overflowX: 'hidden',
        overflowY: 'hidden',
        visibility: analyzing ? 'hidden' : 'visible',
      }}
      id={`slider_${id}`}
    >
      <div
        style={{
          width: `${sliderControl?.width}px`,
          //paddingTop: isFromTrack ? '10px' : '20px',
          //paddingBottom: isFromTrack ? '20px' : '10px',
        }}
      >
        {!sliderControl?.max ? null : (
          <Slider
            min={sliderControl.min || 0}
            max={sliderControl.max}
            //marks={sliderControl.marks || {}}
            step={null}
            included={false}
            onAfterChange={time => selectTime(time)}
            dotStyle={{ borderColor: '#1e8bc3' }}
            handleStyle={{ borderColor: '#cc1d1d' }}
          />
        )}
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
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'action.selected',
        position: 'relative',
      }}
    >
      <Card
        ref={zoomviewRef}
        sx={{ ...loaderSx, zIndex: 1 }}
        // onWheel={e => {
        //   // check state first as debounce, then set set state, then zoom
        //   e.deltaY > 100 ? zoomview?.zoom(64) : zoomview?.zoom(1000)
        // }}
      ></Card>
      {!analyzing ? null : (
        <Card
          sx={{
            ...loaderSx,
            zIndex: 2,
            position: 'absolute',
            left: 16,
            top: 16,
            right: 16,
            bottom: 16,
          }}
        >
          <Loader style={{ margin: 'auto' }} />
        </Card>
      )}
      {/* <div id={`overview-container_${id}`} /> */}
    </Card>
  )
}

export default TrackForm
