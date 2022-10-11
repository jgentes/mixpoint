import {
  AccessTime,
  Eject,
  Pause,
  PlayArrow,
  Replay,
  SettingsBackupRestore,
  Stop,
} from '@mui/icons-material'
import { Button, Card, Link, TextField, Typography } from '@mui/joy'
import { Box, Button as ButtonGroupButton, ButtonGroup } from '@mui/material'
import { PeaksInstance } from 'peaks.js'
import Slider, { SliderProps } from 'rc-slider'
import { useEffect, useRef, useState } from 'react'
import { db, putTrackState, Track, TrackState } from '~/api/db'
import { Events } from '~/api/Events'

import Loader from '~/components/TrackLoader'

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
  const [waveform, setWaveform] = useState<PeaksInstance>()
  const [audioSrc, setAudioSrc] = useState('')
  const [tableState, openTable] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()
  const [track, setTrack] = useState<Track | undefined>()

  const { id, file, mixPoint } = trackState
  if (!id) return null

  let audioElement = useRef<HTMLAudioElement>(null),
    zoomView = waveform?.views.getView('zoomview')

  useEffect(() => {
    const getWaveform = async () => {
      // build waveform
      const track = await db.tracks.get(id)
      setTrack(track)
      if (track) {
        initPeaks({
          track,
          file,
          isFromTrack,
          waveformData: trackState.waveformData,
          setAnalyzing,
          setWaveform,
          setAudioSrc,
          setSliderControl,
        })
      }
    }

    getWaveform()

    // add event listeners
    Events.on('audio', audioEffect)

    // listener cleanup
    return () => Events.remove('audio', audioEffect)
  }, [id, isFromTrack])

  zoomView = waveform?.views.getView('zoomview')

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

  console.log(`${isFromTrack ? 'FROM:' : 'TO:'} `, { trackState, track })

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
    waveform?.player.seek(time)
    zoomView?.enableAutoScroll(false)

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
    new Date(secs * 1000).toISOString().substr(15, 6)

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
          onClick={() => openTable(true)}
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
          paddingTop: isFromTrack ? '10px' : '20px',
          paddingBottom: isFromTrack ? '20px' : '10px',
        }}
      >
        {!sliderControl?.max ? null : (
          <Slider
            min={sliderControl.min || 0}
            max={sliderControl.max}
            marks={sliderControl.marks || {}}
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

  const zoomview = (
    <div
      id={`zoomview-container_${id}`}
      style={{
        height: '150px',
        visibility: analyzing ? 'hidden' : 'visible',
      }}
    />
  )

  const loader = analyzing ? <Loader style={{ margin: '15px 0' }} /> : null

  return (
    <>
      <Box style={{ flex: '0 0 250px' }}>{playerControl}</Box>
      <Box
        style={{
          flex: 'auto',
          overflow: 'hidden',
        }}
      >
        <div>
          {isFromTrack && trackHeader}
          <>{!isFromTrack && track?.name && slider}</>
          <div id={`peaks-container_${id}`}>
            {isFromTrack ? (
              <>
                {loader}
                {zoomview}
              </>
            ) : (
              <>
                {zoomview}
                {loader}
              </>
            )}
          </div>
          <>{isFromTrack && track?.name && slider}</>
          {!isFromTrack && trackHeader}
          <audio id={`audio_${id}`} src={audioSrc} ref={audioElement} />
        </div>
      </Box>
    </>
  )
}

export default TrackForm
