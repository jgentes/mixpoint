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
import { useEffect, useRef, useState } from 'react'
import { db, putTrackState, Track, TrackState } from '~/api/db'
import { Events } from '~/api/Events'
import { openDrawerState } from '~/components/layout/TrackDrawer'
import Loader from '~/components/tracks/TrackLoader'

const TrackCard = ({ trackState }: { trackState: TrackState }) => {
  const [playing, setPlaying] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [bpmTimer, setBpmTimer] = useState<number>()
  const [track, setTrack] = useState<Track | undefined>()

  const { id, file, mixPoint } = trackState
  if (!id) return null

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
            verticalAlign: 'text-bottom',
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

  return (
    <Card
      variant="soft"
      sx={{
        flexGrow: 1,
        borderRadius: 'sm',
        border: '1px solid',
        borderColor: 'action.selected',
      }}
    >
      <Card
        id={`overview-container_${id}`}
        sx={{
          p: 0,
          border: '1px solid',
          borderColor: 'action.focus',
          borderRadius: 'sm',
          bgcolor: 'background.body',
          overflow: 'hidden',
          //height: '50px',
        }}
      />
    </Card>
  )
}

export default TrackCard
